import { Component } from '@angular/core';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';
import { FormControl } from '@angular/forms';

import { ProductService } from '../../../services/store/product.service';
import { DataService } from '../../../services/data.service';

@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrl: './add-category.component.css'
})
export class AddCategoryComponent {
  categories: any[] = [];
  categoryInput: string = '';
  selectedCategoryID: number = 0;
  isEditing: boolean = false;
  categoryForm: FormGroup;

  currentCategory: string = '';
  constructor(
    private dialogRef: MatDialogRef<AddCategoryComponent>,
    private productService: ProductService,
    private dataService: DataService
  ) { 

    this.categoryForm = new FormGroup({
      category_ID: new FormControl<number | null>(0),
      category_name: new FormControl<string>('')
    });
  }

  ngOnInit() {
    this.productService.category$.subscribe((category) => {
      this.categories = category
      console.log(this.categories);
    });
  }
  
  onClose() {
    this.dialogRef.close();
  }

  onDeleteCategory(cat_id: number) {
    this.productService.deleteCategory(cat_id);
    this.categories = this.categories.filter(cat => cat.category_ID !== cat_id);

    this.dataService.deleteData(cat_id, 'deleteCategory').subscribe({
      next: (data) => {
        console.log(data);
        
      },
      error: (error) => {
        console.log(error);
      }
    });

    this.resetForm();
  }

  editCategory() {
    console.log("this is current category: ", this.currentCategory);
    console.log("this is category inputted: ", this.categoryInput);
    if(this.categoryMatch()) {
      this.resetForm();
      return;
    }
    else {
      this.productService.editCategory(this.selectedCategoryID, this.categoryInput)
      this.categories.find(cat => cat.category_ID === this.selectedCategoryID).category_name = this.categoryInput;
      
      this.categoryForm.get('category_name')!.setValue(this.categoryInput);
      this.categoryForm.get('category_ID')!.setValue(this.selectedCategoryID);
      
      this.dataService.patchData(this.categoryForm, 'editCategory').subscribe({
        next: (data) => {
          console.log(data);
        },
        error: (error) => {
          console.log(error);
        }
      });
      this.resetForm();
    }
  }

  resetForm() {
    this.categoryInput = '';
    this.currentCategory = '';
    this.isEditing = false;
    this.selectedCategoryID = 0;
    this.categoryForm.reset();
  }


  onEditCategory(cat_id: number, cat: string) {
    this.currentCategory = cat;
    this.isEditing = true;
    this.categoryInput = cat;
    this.selectedCategoryID = cat_id;
    console.log("this is current category: ", this.currentCategory);
    console.log("this is selected category: ", this.selectedCategoryID);


  }

  categoryExists() {
    return this.categories.includes(this.categoryInput);
  }

  categoryMatch() { 
    return this.categoryInput === this.currentCategory;
  }

  onAddCategory() {
    if (this.categoryInput === '') {
      return;
    }
    if(this.categoryExists()) {
      console.log("category already exists bruh");
      return;
    }
    console.log("this is category inputted: ", this.categoryInput);
    let newCategory = {categoryID: 0, category_name: this.categoryInput};
    this.productService.addCategory(newCategory);
    this.categoryForm.get('category_name')!.setValue(this.categoryInput);
    this.categories.push(newCategory);

    console.log("this is categories: ", this.categories);
    this.dataService.postData(this.categoryForm, 'addCategory').subscribe({
      next: (data) => {
        console.log(data);
      },
      error: (error) => {
        console.log(error);
      }
      
    });

    this.resetForm();

  }

}
