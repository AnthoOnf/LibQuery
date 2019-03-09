import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  endPoint: String = 'http://localhost:3001/';

  constructor(private http: HttpClient) { }

  search(searchOptions, page) {
    return this.http.post(`${this.endPoint}articles?page=${page}`, searchOptions);
  }
}
