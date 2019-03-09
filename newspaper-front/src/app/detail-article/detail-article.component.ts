import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-detail-article',
  templateUrl: './detail-article.component.html',
  styleUrls: ['./detail-article.component.scss']
})
export class DetailArticleComponent implements OnInit {

  @Input() detailArticle;
  @Output() displaySearch = new EventEmitter();

  constructor(private router: Router) { }

  ngOnInit() {

  }

  goBack() {
    this.displaySearch.emit(true);
  }

  sendToPdf(article) {
    window.open(`http://www.eluxemburgensia.lu/BnlViewer/view/index.html?lang=fr#panel:pp%7Cissue:${article.issue}%7Carticle:${article.dtl}`, '_blank');
  }

  getRelatedArticle(article) {
    return "https://www.google.com/search?q=" + article.title + " " + article.date;
  }

}
