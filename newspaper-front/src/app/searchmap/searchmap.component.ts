import { Component, OnInit } from '@angular/core';
import { ArticleService } from '../services/article.service';
import { ActivatedRoute, Router } from "@angular/router";
import { trigger, style, animate, transition } from '@angular/animations';
import * as allCities from './worldcitiespopEU.json';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

declare let L;

@Component({
  selector: 'app-searchmap',
  templateUrl: './searchmap.component.html',
  styleUrls: ['./searchmap.component.scss'],
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({ transform: 'translateX(900px)' }),
          animate('400ms', style({ transform: 'translateX(0)' }))
        ]),
        transition(':leave', [
          style({ transform: 'translateX(0)' }),
          animate('400ms', style({ transform: 'translateX(900px)' }))
        ])
      ]
    )
  ],
})
export class SearchmapComponent implements OnInit {

  minDate = 1860;
  maxDate = 1869;
  config: any = {};
  ranges = [this.minDate, this.maxDate];
  displaySearch = true;
  detailArticle;
  cities: any = [];
  articles: any = [{}, {}, {}];
  loading: boolean = true;
  loadingMore: boolean = false;
  currentPage: number = 1;
  ITEMS_PER_PAGE = 10;
  language = null;
  city = null;
  noMoreArticle = false;
  map: any;
  markers: any = [];
  articlesShown: any = [{}, {}, {}];
  groupMarkers: any;
  layerGroup: any;
  bombIcon = new L.icon({
    iconUrl: '/assets/marker.png',
    iconSize: [32, 32], // size of the icon
    iconAnchor: [16, 32], // point of the icon which will correspond to marker's location
  });
  parentForm: FormGroup;
  initialValues: any;

  constructor(private articleService: ArticleService, private route: ActivatedRoute, private router: Router, private fb: FormBuilder) {
    this.parentForm = this.fb.group({
    });
  }

  ngOnInit() {
    this.initializeSlider();

    this.map = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.map.on('zoomend', function () {
      this.bombIcon
    });
    this.map.options.maxZoom = 15;
    this.layerGroup = L.layerGroup().addTo(this.map);

    this.route.queryParams.subscribe(params => {
      this.language = params['language'];
      this.city = params['city'];
      this.minDate = params['minDate'];
      this.maxDate = params['maxDate'];

      this.search({
        language: this.language,
        city: this.city,
        minDate: this.minDate,
        maxDate: this.maxDate
      });
    });

    document.addEventListener('build', (e: any) => {
      this.onTooltipItemClick(e.detail);
    }, false);

    this.initialValues = {
      city: this.city,
      language: this.language,
      minDate: this.minDate,
      maxDate: this.maxDate,
    }
  }

  onTooltipItemClick(id) {
    this.goToDetail(this.articlesShown.find((article) => article._id === id));
  }

  updateCities() {
    this.articles.forEach(article => {
      for (let i = 0; i < article.locations.length; i++) {
        const currentCityName = article.locations[i];
        if (!this.cities.find((city) => city.name === currentCityName)) {
          let coordinates = allCities.find((city) => city.fields.city === currentCityName);
          const currentCity = {
            name: currentCityName,
            latitude: coordinates.fields.latitude,
            longitude: coordinates.fields.longitude,
            isChecked: true,
            linkedArticles: [article]
          };
          this.cities.push(currentCity);
        } else {
          if (this.cities.linkedArticles && !this.cities.linkedArticles.find((currentArticle) => currentArticle._id !== article._id)) {
            this.cities.find((city) => city.name === currentCityName).linkedArticles.push(article)
          }
        }
      }
    });
    this.updateMarkers();
  }

  search(searchOptions) {
    this.loading = true;
    this.cities = [];
    this.articlesShown = [{}, {}, {}];

    this.articleService.search(searchOptions, this.currentPage).subscribe((articles) => {
      this.articles = articles;
      this.articlesShown = articles;
      this.loading = false;
      this.updateCities();
    });
  }

  loadMore() {
    this.loadingMore = true;
    this.currentPage = this.currentPage + 1;

    const options = {
      language: this.language,
      city: this.city,
      minDate: this.minDate,
      maxDate: this.maxDate
    };
    this.articleService.search(options, this.currentPage).subscribe((articles: any) => {
      if (articles.length === 0) {
        this.noMoreArticle = true;
      } else {
        this.articles = this.articles.concat(articles);
        this.updateCities();
        this.filterArticles();
      }
      this.loadingMore = false;

    });
  }

  initializeSlider() {
    this.config = {
      behaviour: 'drag',
      connect: true,
      start: [0, 5],
      keyboard: true,
      step: 1,
      pageSteps: 10,  // number of page steps, defaults to 10
      range: {
        min: this.minDate,
        max: this.maxDate
      },
    };
  }

  goToDetail(article) {
    this.displaySearch = false;
    this.detailArticle = article;
  }

  updateDisplaySearch(value: boolean) {
    this.displaySearch = value;
    this.detailArticle = null;
  }

  goToHome() {
    this.router.navigate(['home']);
  }

  onCityClick(city) {
    city.isChecked = !city.isChecked;
    this.filterArticles();
    this.updateMarkers();
  }

  filterArticles() {
    this.articles.forEach((article) => {
      let locationsHidden = 0;
      article.locations.forEach((location) => {
        if (!this.cities.find((city) => city.name === location).isChecked) {
          locationsHidden = locationsHidden + 1;
        }
      })
      article.isHidden = locationsHidden === article.locations.length;
    });
    this.articlesShown = this.articles.filter((article) => !article.isHidden);
  }

  updateMarkers() {
    this.markers = [];
    if (this.map) {
      this.layerGroup.clearLayers();
    }
    this.cities.forEach((city) => {
      if (city.isChecked) {
        let html = `${city.name}<ul class="tooltip-articles">`;
        city.linkedArticles.forEach((article) => {
          html = html + `<li><a onclick="document.dispatchEvent(new CustomEvent('build', {'detail': '${article._id}'}));">${article.title}</a></li>`;
        });
        html = html + `</ul>`;
        const marker = L.marker([city.latitude, city.longitude], { icon: this.bombIcon }).addTo(this.layerGroup);
        marker.bindPopup(html)
        this.markers.push(marker);
        city.marker = marker;
      } else {
        this.markers = this.markers.filter((marker) => marker._leaflet_id !== city.marker._leaflet_id);
      }
    });

    this.groupMarkers = new L.featureGroup(this.markers);
    if (this.markers.length > 0) {
      this.map.fitBounds(this.groupMarkers.getBounds());
    }
  }

  onReset() {
    this.initialValues = null;
    this.parentForm.setValue({ city: '', ranges: [1860, 1869], language: null })
  }

  onNewSearch() {
    this.currentPage = 1;
    this.city = this.parentForm.value.city;
    this.language = this.parentForm.value.language;
    this.minDate = this.parentForm.value.ranges[0];
    this.maxDate = this.parentForm.value.ranges[1];
    this.search({
      language: this.parentForm.value.language,
      city: this.parentForm.value.city,
      minDate: this.minDate,
      maxDate: this.maxDate
    });
  }
}
