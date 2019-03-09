import { Component, OnInit, Input } from '@angular/core';
import { FormControl, FormBuilder, Validators, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-search',
  templateUrl: './form-search.component.html',
  styleUrls: ['./form-search.component.scss']
})
export class FormSearchComponent implements OnInit {
  minDate = 1860;
  maxDate = 1869;
  config: any = {};
  ranges = [this.minDate, this.maxDate];
  @Input() parentForm: FormGroup;
  @Input() initialValues: any;

  languages = [{ value: null, label: 'In all languages' }, { value: 'fr', label: 'French' }, { value: 'de', label: 'German' }];

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    this.initializeSlider();
    if (!this.initialValues) {
      this.parentForm.addControl('city', new FormControl('', Validators.required));
      this.parentForm.addControl('language', new FormControl(null));
      this.parentForm.addControl('ranges', new FormControl([1860, 1869], Validators.required));
    } else {
      console.log(this.initialValues.city)

      this.parentForm.addControl('city', new FormControl(this.initialValues.city, Validators.required));
      this.parentForm.addControl('language', new FormControl(this.initialValues.language));
      this.parentForm.addControl('ranges', new FormControl([this.initialValues.minDate, this.initialValues.maxDate], Validators.required));
    }
  }

  initializeSlider() {
    this.config = {
      behaviour: 'drag',
      connect: true,
      start: [20, 80],
      keyboard: true,
      step: 1,
      range: {
        min: this.minDate,
        max: this.maxDate
      },
    };
  }

}
