import { HttpClient } from '@angular/common/http';
import { PaymentService } from './../../services/payment.service';
import { AppService } from './../../app.service';
import { AuthService } from 'src/app/services/auth.service';
import { Component, OnInit, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatStepper, MatSnackBar } from '@angular/material';
import { AngularFirestore } from '@angular/fire/firestore';
import '../../../assets/phonevalidation';
const Handlebars = require("handlebars");
declare var isValidNumber: any;
declare var isValidCountryCode: any;
import {
  IPayPalConfig,
  ICreateOrderRequest 
} from 'ngx-paypal';
import { takeUntil, map } from 'rxjs/operators';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit, AfterViewInit {
  @ViewChild('horizontalStepper') horizontalStepper: MatStepper;
  @ViewChild('verticalStepper') verticalStepper: MatStepper;
  billingForm: FormGroup;
  paymentForm: FormGroup;
  countries = [];
  months = [];
  years = [];
  deliveryMethods = [];
  grandTotal = 0;
  selectedBillingCountry: FormControl;
  monthsArray:string[]=["January", "February", "March","April","May", "June","July","August","September", "October", "November","December"]
  cardLastDigits: string;
  stepId=1;
  shippingTotal= 0;
  paymentCC : boolean;
  paymentPP : boolean;
  chosenPaymentControl : FormControl;
  public payPalConfig ? : IPayPalConfig;
  private _onDestroy = new Subject<void>();


  constructor(public authService : AuthService,
              public formBuilder: FormBuilder,
              private appService : AppService,
              public snackBar: MatSnackBar,
              private http : HttpClient,
              private paymentService: PaymentService,
              private afs : AngularFirestore,
              private ngZone : NgZone) { }

  ngOnInit() { 
    this.authService.Data.cartList.forEach(product=>{
      console.log(product)
      this.grandTotal += product.cartCount*product.newPrice;
      this.shippingTotal += product.cartCount*product.shipping
      console.log(this.shippingTotal)
    });
    this.countries = this.appService.getCountries();
    this.months = this.appService.getMonths();
    this.years = this.appService.getYears();
    this.deliveryMethods = this.appService.getDeliveryMethods();
    this.selectedBillingCountry = new FormControl();
    this.billingForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      middleName: '',
      company: '',
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      countryCode: ['', Validators.required],
      country: [this.selectedBillingCountry, Validators.required],
      city: ['', Validators.required],
      state: '',
      zip: ['', [Validators.required]],
      address: ['', Validators.required]
    });
    console.log(this.authService.user);
    // if(this.authService.user && this.authService.user['billingAddress'] 
    // && this.authService.user['billingAddress'].country && this.authService.user['billingAddress'].country.code ) {
    //   // this.selectedBillingCountry = new FormControl(this.authService.user['billingAddress'].country.code);
    //   alert()
    //   this.selectedBillingCountry.setValue(this.authService.user['billingAddress'].country);
    //   this.billingForm.get('country').setValue(this.selectedBillingCountry);
    // }
    this.billingForm.get('countryCode').valueChanges
    .pipe(takeUntil(this._onDestroy))
    .subscribe(() => {
      console.log('validate')
      this.validateCountry();
    });
    this.billingForm.get('phone').valueChanges
    .pipe(takeUntil(this._onDestroy))
    .subscribe(() => {
      this.validatePhone();
    });
    this.chosenPaymentControl = new FormControl();
    this.paymentForm = this.formBuilder.group({
      chosenPaymentMethod: [this.chosenPaymentControl, Validators.required]
    })
    console.log(this.deliveryMethods[0])
    if(this.authService.user['billingAddress']){
      console.log(this.authService.user['billingAddress'])
      Object.keys(this.authService.user['billingAddress']).forEach(key => {
        if(key == 'country') {
          this.billingForm.get(key).setValue(this.authService.user['billingAddress'][key].code)
        } else {
          this.billingForm.get(key).setValue(this.authService.user['billingAddress'][key])
        }
      });
    }
  }
  initStripeForm() {
    this.paymentService.mountPayment();
    let country = this.countries.find((elt)=> {return elt.code == this.billingForm.get('country').value})
    this.billingForm.get('country').setValue(country)
    console.log(this.billingForm)
  }
  validateCountry(){
    if(this.billingForm.get('countryCode').value && isValidCountryCode(this.billingForm.get('countryCode').value)){
      this.billingForm.get('countryCode').setErrors(null)
    }else{
      this.billingForm.get('countryCode').setErrors({incorrect: true});
    }
  }

  validatePhone(){
    console.log(this.billingForm.get('phone').value, isValidNumber(this.billingForm.get('phone').value));
    if(this.billingForm.get('phone').value && isValidNumber(this.billingForm.get('phone').value)){
      this.billingForm.get('phone').setErrors(null)
    }else{
      this.billingForm.get('phone').setErrors(null);
    }
  }
  public onBillingFormSubmit(values:Object):void {
    
    if (this.billingForm.valid && this.billingForm.pristine == false) {
      console.log(this.billingForm.value)
      this.afs.collection('customer').doc(this.authService.user['uid']).update({
        billingAddress : this.billingForm.value
      })
      this.snackBar.open('Your billing address information updated successfully!', '×', { panelClass: 'success', verticalPosition: 'top', duration: 3000 });

    }
  }
  setPaymentMethod(event) {
    console.log(event);
    if(event.value == 'cc') {
      this.paymentCC = true;
      this.paymentPP = false;
      setTimeout(()=>{this.initStripeForm()},100)
    } else {
      this.paymentCC = false;
      this.paymentPP = true;
      this.initConfig();
    }
  }
  ngAfterViewInit(): void {
    
  }
  private initConfig(): void {
    let products = this.paymentService.processOrderPaymentData(this.authService.Data.cartList);
    console.log(products, this.grandTotal, this.shippingTotal, this.grandTotal + this.shippingTotal, '' + (this.grandTotal + this.shippingTotal));
    this.payPalConfig = {
        currency: 'USD',
        clientId: 'AQSj8idbJrFpQAoSRoekKSLJO_l3uhPFROnPNbvEQj9nDXbwGZkky5J4C3M6cCma0u9_vuKUlg9cC54c',
        createOrderOnClient: (data) => < ICreateOrderRequest > {
            intent: 'CAPTURE',
            application_context: {payment_method: {payer_selected: 'PAYPAL'}},
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: '' + (this.grandTotal + this.shippingTotal),
                    breakdown: {
                        item_total: {
                            currency_code: 'USD',
                            value: this.grandTotal+''
                        },
                        shipping: {
                          currency_code: 'USD',
                          value: this.shippingTotal+''
                        }
                    }
                },
                items: products
            }]
        },
        advanced: {
            commit: 'true'
        },
        style: {
            label: 'paypal',
            layout: 'horizontal',
            tagline: false,
            size: 'responsive'
        },
        onApprove: (data, actions) => {
            console.log('onApprove - transaction was approved, but not authorized', data, actions);
            actions.order.get().then(details => {
                console.log('onApprove - you can get full order details inside onApprove: ', details);
            });

        },
        onClientAuthorization: (data) => {
            console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
            if(data.status == 'COMPLETED') {
              this.placeOrder();
            }
            // this.showSuccess = true;
        },
        onCancel: (data, actions) => {
            console.log('OnCancel', data, actions);
            // this.showCancel = true;

        },
        onError: err => {
            console.log('OnError', err);
            // this.showError = true;
        },
        onClick: (data, actions) => {
            console.log('onClick', data, actions);
            // this.resetStatus();
        }
    };
}

  getStepId($event){
    console.log(this.stepId);
    this.stepId++;
  }
  submitPayment() {
    this.paymentService.processPayment(this.authService.Data.cartList).then(
      (result : any)=>{
        console.log(result);
        if(result && result.paymentIntent && result.paymentIntent.status == 'succeeded') {
          this.placeOrder();
        }
      }
    );
  }

  public placeOrder(){
    // alert();
    console.log(this.billingForm, this.paymentForm)
    if(true){ //this.billingForm.valid && this.paymentForm.valid
      if(this.billingForm.pristine == false || this.paymentForm.pristine == false){
        this.afs.collection('customer').doc(this.authService.user['uid']).update({
          billingAddress: this.billingForm.value,
          paymentMethod: this.chosenPaymentControl.value,
        })
      }
      let date = new Date();
      let orderDate = this.monthsArray[date.getMonth()] + ' '+ date.getDate() + ', '+ date.getFullYear();
      let orderObj = {
        billingAddress: this.billingForm.value,
        paymentMethod: this.chosenPaymentControl.value,
        customerId: this.authService.user['uid'],
        customerName:this.authService.user['displayName'],
        customerEmail:this.authService.user['email'],
        products: this.authService.Data.cartList,
        totalShipping: this.authService.Data.totalShipping,
        totalPrice: this.authService.Data.totalPrice,
        totalOrderCount: this.authService.Data.totalCartCount,
        createdAt: orderDate
      }
      this.http.post(this.authService.apiUrl+'createOrder', {order: orderObj, user: this.authService.user}).pipe(
        map(
          (data)=>{
            console.log(data);
            this.authService.db.collection('mail').add({
              from:'eachonlinedeveloper@gmail.com',
              to: this.authService.user['email'],
              template:{
                name:'invoiceTemplate',
                data:{
                  firstname: this.billingForm.value.firstName,
                  lastname:this.billingForm.value.lastName,
                  address:this.billingForm.value.address,
                  city:this.billingForm.value.city,
                  country: this.billingForm.value.country,
                  orderDate: orderDate,
                  product: this.authService.Data.cartList,
                  grandTotal: +this.grandTotal + this.shippingTotal,
                  shipping: this.shippingTotal,
                  total: this.grandTotal
                }
              }
            }).then(
              ()=>{
                this.snackBar.open('Your order has been placed! An email confirmation has been sent to you.', '×', { panelClass: 'success', verticalPosition: 'top', duration: 3000 });
                this.afs.collection('cart').doc(this.authService.user['uid']).update({
                  products:[],
                  totalCartCount:0,
                  totalPrice:0,
                  totalShipping:0
                }).then(
                  ()=>{
                    this.ngZone.run(() => {
                      this.paymentForm.setErrors(null);
                      this.paymentForm.setValidators(null);
                      this.horizontalStepper.selected.completed = true;
                      this.horizontalStepper.selected.editable = false;
                      this.horizontalStepper.next();
                      this.horizontalStepper._steps.forEach(step => step.editable = false)
                      this.authService.Data.cartList = [];    
                      this.authService.Data.totalPrice = 0;
                      this.authService.Data.totalShipping = 0;
                      this.authService.Data.totalCartCount = 0;
                    });         
                  },(e)=>{
                    this.snackBar.open('Something went wrong please try again', '×', { panelClass: 'error', verticalPosition: 'top', duration: 3000 });
                  }
                )
              }
            ).catch(
              (error)=>{
                console.log(error)
                console.log(
                  'name' ,this.billingForm.value.firstName,
                   'lastname', this.billingForm.value.lastName,
                  'adress',this.billingForm.value.address,
                  'city',this.billingForm.value.city,
                   'country',this.billingForm.value.country.name,
                   'date',orderDate,
                   'productlist',this.authService.Data.cartList,
                   'shipping',this.shippingTotal,
                   'total',this.grandTotal
                )
                this.snackBar.open('Something went wrong please try again', '×', { panelClass: 'error', verticalPosition: 'top', duration: 3000 });
              }
            )
          }
        )
      ).subscribe()
    }
    // this.horizontalStepper._steps.forEach(step => step.editable = false);
    // this.verticalStepper._steps.forEach(step => step.editable = false);
    // this.authService.Data.cartList.length = 0;    
    // this.authService.Data.totalPrice = 0;
    // this.authService.Data.totalCartCount = 0;
  }

}
