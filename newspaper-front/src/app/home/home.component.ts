import { Component, ViewEncapsulation } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { FormGroup, FormBuilder } from '@angular/forms';
import {FormControl} from '@angular/forms';
import { AuthorsService } from '../services/authors-service/authors.service';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent {
  person: null;
  city: null;

  authors: any = null;
  language = null;
  parentForm: FormGroup;
  myControl = new FormControl();
  filteredOptions: any = null;

  constructor(private router: Router, private fb: FormBuilder, private authorsService: AuthorsService, ) {
    this.parentForm = this.fb.group({
    });
  }

  ngOnInit() {
  }

  search() {
    if (this.parentForm.valid) {
      let navigationExtras: NavigationExtras = {
        queryParams: {
          city: this.parentForm.value.city,
          language: this.parentForm.value.language,
          minDate: this.parentForm.value.ranges[0],
          maxDate: this.parentForm.value.ranges[1],
        }
      };
      this.router.navigate(['search-map'], navigationExtras);
    } else {
      console.log('not valid')
    }
  }

  searchAuthors() {
    console.log(this.person);
    this.authorsService.autocomplete(this.person).subscribe((author) => {
      this.authors = author;
      console.log(author)
    });
  }

  searchAuthor()
  {
    this.authorsService.search(this.person).subscribe((author) => {
      console.log(author);
    });
  }

  onAuthorChange(event: any)
  {
    if(event.target.value && event.target.value.length > 1) {
      this.authorsService.autocomplete(event.target.value).subscribe((author) => {
        this.authors = author;
        console.log(author)
      });
    }

  }

  getAuthor(author)
  {
    var test = this.authorsService.search(author).subscribe((result) =>
    {
      window.open(result.url);
    });
  }

}
