var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../../shared/shared.module';
import { PipesModule } from '../../theme/pipes/pipes.module';
import { BrandsComponent } from './brands.component';
import { BrandComponent } from './brand/brand.component';
export var routes = [
    { path: '', component: BrandsComponent, pathMatch: 'full' },
    { path: ':name', component: BrandComponent }
];
var BrandsModule = /** @class */ (function () {
    function BrandsModule() {
    }
    BrandsModule = __decorate([
        NgModule({
            imports: [
                CommonModule,
                RouterModule.forChild(routes),
                FormsModule,
                NgxPaginationModule,
                SharedModule,
                PipesModule
            ],
            declarations: [
                BrandsComponent,
                BrandComponent
            ]
        })
    ], BrandsModule);
    return BrandsModule;
}());
export { BrandsModule };
//# sourceMappingURL=brands.module.js.map