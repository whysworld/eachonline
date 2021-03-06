import { AngularFirestore } from '@angular/fire/firestore';
import { Component, OnInit, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, NavigationEnd, Data, NavigationStart } from '@angular/router';
import { Settings, AppSettings } from '../app.settings';
import { AppService, User } from '../app.service';
import { Category, Product } from '../app.models';
import { SidenavMenuService } from '../theme/components/sidenav-menu/sidenav-menu.service';
import { AuthService } from '../services/auth.service';
import * as algoliasearch from 'algoliasearch/lite';
import { CompileShallowModuleMetadata } from '@angular/compiler';

const searchClient = algoliasearch(
  'X5I45PX5A1',
  'd344813a13a6a7918a0eefb1e1000666'
);

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss'],
  providers: [ SidenavMenuService ]
})
export class PagesComponent implements OnInit, AfterViewInit {
  public showBackToTop:boolean = false;
  public categories:any[]=[];
  public category:Category;
  public sidenavMenuItems:Array<any>;
  public currencies = ['USD'];
  public currency:any;
  public slides = [
    { title: 'The biggest sale', subtitle: 'Special for today', image: 'assets/images/carousel/image1.jpg' },
    { title: 'Summer collection', subtitle: 'New Arrivals On Sale', image: 'assets/images/carousel/image2.jpg' },
    { title: 'The biggest sale', subtitle: 'Special for today', image: 'assets/images/carousel/image3.jpg' },
    { title: 'Summer collection', subtitle: 'New Arrivals On Sale', image: 'assets/images/carousel/image4.jpg' }
  ];
  public flags = [
    { name:'English', image: 'assets/images/flags/gb.svg' },
    // { name:'German', image: 'assets/images/flags/de.svg' },
    // { name:'French', image: 'assets/images/flags/fr.svg' },
    // { name:'Russian', image: 'assets/images/flags/ru.svg' },
    // { name:'Turkish', image: 'assets/images/flags/tr.svg' }
  ]
  public flag:any;
  @ViewChild('sidenav') sidenav:any;
  public localAuthService:AuthService;
  config = {
    indexName: 'product',
    searchClient
  };
  public settings: Settings;
  public data : Data;
  public user : User;
  showSearchResults: boolean;
  localAppService: AppService;
  openSearch: boolean = false;
  mobile:boolean = document.documentElement.clientWidth <= 768 ? true : false;
  showCarousel: boolean = false;
  constructor(public appSettings:AppSettings, 
              public appService:AppService, 
              private afs:AngularFirestore,
              public authService: AuthService,
              public sidenavMenuService:SidenavMenuService,
              public router:Router) { 
    this.settings = this.appSettings.settings; 
  }

  ngOnInit() {
    console.log(window.location.pathname)
    this.currency = this.currencies[0];
    this.flag = this.flags[0];    
    this.localAuthService = this.authService;
    this.localAppService = this.appService;
    this.data = this.authService.Data;
    this.user = this.authService.user;
    if(window.location.pathname == '/' || window.location.pathname.includes('learn')){
      this.showCarousel = true
    }
    console.log(this.authService.Data, 'dataaa ')
    this.router.events.subscribe(
      (val)=>{
        if(val instanceof NavigationStart){
          if(val.url.includes('learn') || val.url == '/'){
            this.showCarousel = true
          }else{
            this.showCarousel = false
          }
          console.log(val)
        }
      } 
    )
    this.authService.db.collection('categories').get().then(
      (snapshot)=>{
        snapshot.forEach(
          (doc)=>{
            let data = doc.data()
            data.id = doc.id
            this.categories.push(data)
          }
        )

      }
    )
    // this.getCategories();
    this.sidenavMenuItems = this.sidenavMenuService.getSidenavMenuItems();
  } 

  openSearchBox(){
    this.openSearch = !this.openSearch;
    console.log(this.openSearch)
  }

  public signOut(){
    this.authService.Data = {
      categories: [], 
      compareList:[], 
      wishList: [],  
      cartList: [],  
      totalShipping:0,
      totalPrice: null, 
      totalCartCount: 0 
    }
    this.authService.logout();
    this.data = this.authService.Data;
    
  }

  public changeLang(flag){
    this.flag = flag;
  }

//   $zopim(function() {
//    $zopim.livechat.hideAll();
// });

  searchIfEnter(event) {
    console.log(event);
    // if(event.key == 'Enter') {
    //   this.search();
    // }
  }
  toggleShowHits(value) {
    if(value) {
      this.appService.showSearchResults = value;
    }
  }

  keepSearchOpen(e: Event){
    e.stopPropagation();
  }



  // public getCategories(){    
  //   this.appService.getCategories().subscribe(data => {
  //     this.categories = data;
  //     this.category = data[0];
  //     this.authService.Data.categories = data;
  //   })
  // }

  viewProduct(product) {
    console.log(product, `products/${product.ID}`);
    let productName = product.name.split(' ').join('-')
    this.router.navigate([`/products/${product.objectID}/${productName}`])
  }

  search(){
    let searchWord = (<HTMLInputElement>document.getElementsByClassName('ais-SearchBox-input')[0]).value
    searchWord.split(' ').join('-')
    this.router.navigate([`/search/${searchWord}`])
  }

  public changeCategory(event){
    if(event.target){
      this.category = this.categories.filter(category => category.name == event.target.innerText)[0];
    }
    if(window.innerWidth < 960){
      this.stopClickPropagate(event);
    } 
  }

  public remove(product) {
      const index: number = this.authService.Data.cartList.indexOf(product);
      if (index !== -1) {
          this.authService.Data.cartList.splice(index, 1);
          this.authService.Data.totalShipping = this.authService.Data.totalShipping - product.shipping*product.cartCount;
          this.authService.Data.totalPrice = this.authService.Data.totalPrice - product.newPrice*product.cartCount;
          this.authService.Data.totalCartCount = this.authService.Data.totalCartCount - product.cartCount;
          this.authService.resetProductCartCount(product);
          let document = this.afs.collection('cart').doc(`${this.authService.user['uid']}`)
          document.update({
            products: this.authService.Data.cartList,
            totalPrice: this.authService.Data.totalPrice,
            totalShipping: this.authService.Data.totalShipping,
            totalCartCount:this.authService.Data.totalCartCount
          })
      }        
  }

  public clear(){
    this.authService.Data.cartList.forEach(product=>{
      this.authService.resetProductCartCount(product);
    });
    this.authService.Data.cartList.length = 0;
    this.authService.Data.totalPrice = 0;
    this.authService.Data.totalShipping = 0;
    this.authService.Data.totalCartCount = 0;
    let document = this.afs.collection('cart').doc(`${this.authService.user['uid']}`)
    document.update({
      products: this.authService.Data.cartList,
      totalPrice: this.authService.Data.totalPrice,
      totalShipping: this.authService.Data.totalShipping,
      totalCartCount:this.authService.Data.totalCartCount
    })
  }
 

  public changeTheme(theme){
    this.settings.theme = theme;       
  }

  public stopClickPropagate(event: any){
    event.stopPropagation();
    event.preventDefault();
  }

 
  public scrollToTop(){
    var scrollDuration = 200;
    var scrollStep = -window.pageYOffset  / (scrollDuration / 20);
    var scrollInterval = setInterval(()=>{
      if(window.pageYOffset != 0){
         window.scrollBy(0, scrollStep);
      }
      else{
        clearInterval(scrollInterval); 
      }
    },10);
    if(window.innerWidth <= 768){
      setTimeout(() => { window.scrollTo(0,0) });
    }
  }
  @HostListener('window:scroll', ['$event'])
  onWindowScroll($event) {
    ($event.target.documentElement.scrollTop > 300) ? this.showBackToTop = true : this.showBackToTop = false;  
  }

  ngAfterViewInit(){    
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) { 
        this.sidenav.close();
        let searchWord = (<HTMLInputElement>document.getElementsByClassName('ais-SearchBox-input')[0])
        if(searchWord){
          searchWord.value = '';
        }
      }                
    });
    this.sidenavMenuService.expandActiveSubMenu(this.sidenavMenuService.getSidenavMenuItems());
    
  }

  public closeSubMenus(){
    if(window.innerWidth < 960){
      this.sidenavMenuService.closeAllSubMenus();
    }    
  }

}