import { NgModule } from "@angular/core";
import { PromotionComponent } from "../navigation/promotion/promotion.component";
import { AddOnComponent } from "../navigation/promotion/add-on/add-on.component";
import { BundleDealsComponent } from "../navigation/promotion/bundle-deals/bundle-deals.component";
import { DiscountsComponent } from "../navigation/promotion/discounts/discounts.component";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { LandingComponent } from "../navigation/promotion/landing/landing.component";
import { RouterOutlet } from "@angular/router";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableModule } from "@angular/material/table";
import { MatMenuModule } from "@angular/material/menu";
import { BundleTypesComponent } from "../navigation/promotion/bundle-deals/bundle-types/bundle-types.component";
import { LazyLoadImageModule } from "ng-lazyload-image";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { PromoPreviewComponent } from "../navigation/manage-warehouse/promo-preview/promo-preview.component";

@NgModule({
    declarations: [
        PromotionComponent,
        DiscountsComponent,
        BundleDealsComponent,
        AddOnComponent,
        PromoPreviewComponent,
        LandingComponent,
        BundleTypesComponent    
    ],
    imports: [
        MatFormFieldModule, 
        MatInputModule, 
        MatDatepickerModule,
        FormsModule,
        CommonModule,
        RouterOutlet,
        MatProgressSpinnerModule,
        MatTableModule,
        MatMenuModule,
        LazyLoadImageModule,
        MatAutocompleteModule,
        ReactiveFormsModule
    ]
})
export class PromotionsModule { }