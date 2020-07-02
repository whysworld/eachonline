import { AuthService } from 'src/app/services/auth.service';
import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ProductDialogComponent } from '../../shared/products-carousel/product-dialog/product-dialog.component';
import { AppService } from '../../app.service';
import { Product, Category } from "../../app.models";
import { AngularFirestore } from '@angular/fire/firestore';
import * as algoliasearch from 'algoliasearch/lite';
import { Inject, forwardRef } from '@angular/core';
import { async } from '@angular/core/testing';

const searchClient = algoliasearch(
  'X5I45PX5A1',
  'd344813a13a6a7918a0eefb1e1000666'
);

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit  {
  @ViewChild('sidenav') sidenav: any;
  public sidenavOpen:boolean = true;
  private sub: any;
  public viewType: string = 'grid';
  public viewCol: number = 25;
  public counts = [12, 24, 36];
  public count:any;
  public sortings = ['Sort by Default', 'Best match', 'Lowest first', 'Highest first'];
  public sort:any;
  public products: any[] = [];
  public categories:Category[];
  public brands = [];
  public priceFrom: number = 750;
  public priceTo: number = 1599;
  public colors = ["#5C6BC0","#66BB6A","#EF5350","#BA68C8","#FF4081","#9575CD","#90CAF9","#B2DFDB","#DCE775","#FFD740","#00E676","#FBC02D","#FF7043","#F5F5F5","#000000"];
  public sizes = ["S","M","L","XL","2XL","32","36","38","46","52","13.3\"","15.4\"","17\"","21\"","23.4\""];
  public page:any;
  config = {
    indexName: 'product',
    searchClient
  };
  public state: {
    items: object[]
 }
 url:string;
 localAppService:AppService;
 productRenderer:any;
 productList:any[]=[];
 categoryRefined: any;
  
  constructor(
    private activatedRoute: ActivatedRoute,
    public authService: AuthService,
    public appService:AppService, 
    public dialog: MatDialog, 
    private router: Router,
    private route : ActivatedRoute
    ) { }

  ngOnInit() {
    this.route.params.subscribe(
      (data)=>{
        console.log(data)
        this.productRenderer = (products)=>{
          products = products.filter(elt=>elt.status == 'published');
          if(window.location.pathname == '/products'){
            this.productList = products
          }else if(window.location.href.includes('search')){
            this.productList = this.search(data.name, products)
          }else{
            this.productList =  this.searchCategory(data.name)  
            // this.productList =  this.searchCategory(this.appService.currentListingUrl.split('/').pop())
            console.log(this.productList)
          }
          return products;
        }
      }
    )
    console.log(this.route.snapshot.data['facets']);
    let facets : any[] = this.route.snapshot.data['facets']
    this.categoryRefined = (cats)=>{
      console.log(facets);
      return cats;
    }
    this.localAppService = this.appService;
    // this.router.events.subscribe(
    //   (val)=>{
    //     if(val instanceof NavigationStart){
    //       console.log(val)
    //       this.appService.currentListingUrl = val.url;
    //       if(this.appService.currentListingUrl.split('/').pop() != 'products'){
    //         this.productList =  this.searchCategory(this.appService.currentListingUrl.split('/').pop())
    //       }else{
    //         this.productList = this.search('', null)
    //       }
    //       // else{
    //       //   this.productList = products
    //       // }
    //       // this.productRenderer = (products)=>{
            
    //       //   console.log(this.productList)
    //       //   return products.map(product=>({...product}))
    //       // }
    //     }
    //   }
    // )

    this.appService.currentListingUrl = window.location.pathname;
    
    
    
    
    console.log(this.appService.currentListingUrl, this.appService.currentListingUrl.split('/').pop())
    this.count = this.counts[0];
    this.sort = this.sortings[0];
    if(window.innerWidth < 960){
      this.sidenavOpen = false;
    };
    if(window.innerWidth < 1280){
      this.viewCol = 33.3;
    };

    
    // this.getCategories();
    // this.getBrands();

  }
  searchCategory(category):any {
    searchClient.search(
      [
        {
          indexName: 'product', 
          query: '',
          params: {facetFilters: ['categoryId:'+category, 'status:published'] }
        }
      ]).then((data)=>{
        console.log(data)
        this.productList = data.results[0].hits;
        return this.productList;
      })
  }

  search(value, products):any {
    let index = searchClient.initIndex('product');
    index.search(
        {
          query: value,
        }
      ).then((data)=>{
        console.log('rdfghjkhgfcdrtfyguh', products)
        if(products != null){
          this.productList = [];
          data.hits.forEach(product=>{
            let found =  products.find(elt=> {return elt.name == product.name} )
            console.log(found)
            if(found) {
              console.log(this.productList)
              
              this.productList.push(product) 
              // this.productList.push(product)
            }
          })
        }else{
          console.log('product list1')
          this.productList = data.hits.filter((hits)=>{return hits.status == 'published'});
        }
        // console.log(data)
        
        return this.productList;
      })
  }

  // public getAllProducts(){
  //   this.authService.db.collection('products').get().then(
  //     (snapshot)=>{
  //       snapshot.forEach(elt=>{
  //         let data = elt.data();
  //         data.id = elt.id;
  //         this.products.push(data)
  //       })
  //     }
  //   ).finally(
  //     ()=>{
  //       console.log(this.products)
  //     }
  //   )
  // }

  // public getCategories(){  
  //   if(this.authService.Data.categories.length == 0) { 
  //     this.appService.getCategories().subscribe(data => {
  //       this.categories = data;
  //       console.log(this.categories, 'categories')
  //       this.authService.Data.categories = data;
  //     });
  //   }
  //   else{
  //     this.categories = this.authService.Data.categories;
  //   }
  // }

  // public getBrands(){
  //   this.brands = this.appService.getBrands();
  // }

  ngOnDestroy() {
  }

  @HostListener('window:resize')
  public onWindowResize():void {
    (window.innerWidth < 960) ? this.sidenavOpen = false : this.sidenavOpen = true;
    (window.innerWidth < 1280) ? this.viewCol = 33.3 : this.viewCol = 25;
  }

  public changeCount(count){
    this.count = count;
    // this.getAllProducts(); 
  }

  public changeSorting(sort){
    this.sort = sort;
  }

  public changeViewType(viewType, viewCol){
    this.viewType = viewType;
    this.viewCol = viewCol;
  }

  public openProductDialog(product){   
    let dialogRef = this.dialog.open(ProductDialogComponent, {
        data: product,
        panelClass: 'product-dialog'
    });
    dialogRef.afterClosed().subscribe(product => {
      if(product){
        this.router.navigate(['/products', product.objectID, product.name]); 
      }
    });
  }

  public onPageChanged(event){
      this.page = event;
      // this.getAllProducts(); 
      window.scrollTo(0,0); 
  }

  public onChangeCategory(event){
    console.log(event)
    this.products=[];
    this.authService.db.collection('products').where('categoryId', '==', event.id).get().then(
      (snapshot)=>{
        snapshot.forEach(
          (doc)=>{
            let data = doc.data()
            this.products.push(data)
          }
        )
      }
    )
    // if(event.target){
    //   this.router.navigate(['/products', event.target.innerText.toLowerCase()]); 
    // }   
  }

}

