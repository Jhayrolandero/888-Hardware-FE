import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DataService } from '../../../services/data.service';
import { ProductService } from '../../../services/store/product.service';

@Component({
  selector: 'app-add-category-dialog',
  templateUrl: './add-category-dialog.component.html',
  styleUrl: './add-category-dialog.component.css'
})
export class AddCategoryDialogComponent implements OnInit {
  categories: any[] = [];
  selectedCategory: any = 'No Selected Category.' ;
  categoryLevels: { [key: string]: { [key: string]: { [key: string]: string[] } } } = {};
  selectedLevel1: string = '';
  selectedLevel2: string = '';
  selectedLevel3: string = '';
  selectedLevel4: string = '';
  alreadySelected = false;
  
  constructor(
    private dialogRef: MatDialogRef<AddCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private productService: ProductService,
  ) { 
    
    console.log(data)
    if(data.category_name !== '') {
      const levels = data.category_name.split('/');
      this.selectedLevel1 = levels[0];
      this.selectedLevel2 = levels[1] || '';
      this.selectedLevel3 = levels[2] || '';
      this.selectedLevel4 = levels[3] || '';
      this.alreadySelected = true;
      this.selectedCategory = data.category_name;
    } else {
      this.selectedCategory = 'No Selected Category.'
    }
  }


  ngOnInit() {
    this.productService.category$.subscribe((category) => {
      this.categories = category
      console.log(this.categories);
    });
    this.formatCategories(this.categories);
  }

  formatCategories(categories: any[]) {
    categories.forEach(category => {
      const levels = category.category_name.split('/');
      const level1 = levels[0];
      const level2 = levels[1] || '';
      const level3 = levels[2] || '';
      const level4 = levels[3] || '';

      if (!this.categoryLevels[level1]) {
        this.categoryLevels[level1] = {};
      }

      if (!this.categoryLevels[level1][level2]) {
          this.categoryLevels[level1][level2] = {};
      }

      if (!this.categoryLevels[level1][level2][level3]) {
          this.categoryLevels[level1][level2][level3] = [];
      }

      if (level4 && !this.categoryLevels[level1][level2][level3].includes(level4)) {
          this.categoryLevels[level1][level2][level3].push(level4);
      }
    });

    this.categoryLevels = { ...this.categoryLevels };
    console.log("this is the new one", this.categoryLevels);
  }

  getLevel1Categories(): string[] {
    return Object.keys(this.categoryLevels);
  }

  getLevel2Categories(level1: string): string[] {
    return Object.keys(this.categoryLevels[level1] || {});
  }

  getLevel3Categories(level1: string, level2: string): string[] {
    return Object.keys(this.categoryLevels[level1][level2] || {});
  }

  getLevel4Categories(level1: string, level2: string, level3: string): string[] {
    return this.categoryLevels[level1][level2][level3] || [];
  }

  selectLevel1(level1: string) {
    this.selectedCategory = `${level1}`;
    this.selectedLevel1 = level1;
    this.selectedLevel2 = '';
    this.selectedLevel3 = '';
    this.selectedLevel4 = '';
  }

  selectLevel2(level2: string) {
    this.selectedLevel2 = level2;
    this.selectedLevel3 = '';
    this.selectedLevel4 = '';
    this.selectedCategory = `${this.selectedLevel1}/${this.selectedLevel2}`;
  }

  selectLevel3(level3: string) {
    this.selectedLevel3 = level3;
    this.selectedLevel4 = '';
    this.selectedCategory = `${this.selectedLevel1}/${this.selectedLevel2}/${this.selectedLevel3}`;
  }

  selectLevel4(level4: string) {
    this.selectedLevel4 = level4;
    this.selectedCategory = `${this.selectedLevel1}/${this.selectedLevel2}/${this.selectedLevel3}/${level4}`;
  }

  hasMoreSubcategories(): boolean {
    if (!this.selectedLevel1) {
        return true; 
    }
    if (this.selectedLevel1 && this.getLevel2Categories(this.selectedLevel1).length > 0 && !this.selectedLevel2) {
        return true; 
    }
    if (this.selectedLevel2 && (this.getLevel3Categories(this.selectedLevel1, this.selectedLevel2)[0] !== '') && !this.selectedLevel3) {
      console.log(this.getLevel3Categories(this.selectedLevel1, this.selectedLevel2))  
      return true; 
    }
    if (this.selectedLevel3 && this.getLevel4Categories(this.selectedLevel1, this.selectedLevel2, this.selectedLevel3).length > 0 && !this.selectedLevel4) {
      console.log(this.getLevel4Categories(this.selectedLevel1, this.selectedLevel2, this.selectedLevel3))  
      return true; 
    }
    return false; 
  }

  submitCategory() {
    this.selectedCategory = this.categories.find(category => category.category_name === this.selectedCategory);
    this.dialogRef.close(this.selectedCategory);
  }

  onClose() {
      this.dialogRef.close(this.data);
  }

}
