import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthorsService {

  endPoint: String = 'http://localhost:3001/';

  constructor(private http: HttpClient) { }

  autocomplete(query) {
    return this.http.get(`${this.endPoint}authors/${query}`);
  }

  search(name): any {
    return this.http.get(`${this.endPoint}author/${name}`);
  }
}
