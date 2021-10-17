import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  baseUrl = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  /**
   * Function purpose : Get All added elements in the database
   * Needed Parameters :-
   * 1- end point name for the called api
   * 2- pramas parameter which is will be optional parameter
   */
  GetMethodWithPipe(
    endPoint: string,
    params?: any,
    queryPrams?: any
  ): Observable<any> {
    if (!params) {
      return this.http.get(this.baseUrl + endPoint).pipe(
        map((data: any) => {
          return data.data.length > 0 ? data.data : [];
        }),
        catchError((error) => {
          if (error.status !== 200) {
            return throwError(error.error.message);
          }
        })
      );
    }
    //here is the condition needed if the called get method api has to get specific data with a selected row
    else {
      if (!queryPrams) {
        return this.http.get(this.baseUrl + endPoint + '/' + params).pipe(
          map((data: any) => {
            return data.data.length > 0 ? data.data : [];
          }),
          catchError((error) => {
            if (error.status !== 200) {
              return throwError(error.error.message);
            }
          })
        );
      } else {
        return this.http
          .get(this.baseUrl + endPoint + '?id=' + queryPrams)
          .pipe(
            map((data: any) => {
              return data.data.length > 0 ? data.data : [];
            }),
            catchError((error) => {
              if (error.status !== 200) {
                return throwError(error.error.message);
              }
            })
          );
      }
    }
  }

  /**
   * Function purpose : Post All new data to the database
   * Needed Parameters :-
   * 1- endPoint : end point name for the called api
   * 2- body :  parameter which is the designed model to affect row in the database
   */
  PostMethodWithPipe(endPoint: string, body: any): Observable<any> {
    return this.http.post(this.baseUrl + endPoint, body).pipe(
      catchError((error) => {
        if (error.status !== 200) {
          return throwError(error.error.message);
        }
      })
    );
  }

  /**
   * Function purpose : Delete a selected row form the database
   * Needed Parameters :-
   * 1- endPoint : end point name for the called api
   * 2- params :  parameter which is will be needed to select the needed id of the selected row needed for delete
   */
  DeleteMethodWithPipe(endPoint: any, params: any): Observable<any> {
    return this.http.delete(this.baseUrl + endPoint + '/' + params).pipe(
      catchError((error) => {
        if (error.status !== 200) {
          return throwError(error.error.message);
        }
      })
    );
  }

  /**
   * Function purpose : Update a selected row form the database
   * Needed Parameters :-
   * 1- endPoint : end point name for the called api
   * 2- params :  parameter which is will be needed to select the needed id of the selected row needed for delete
   * 3- body : parameter needed to show the affected values to be updated in the database
   */
  UpdateMethodWithPipe(endPoint: any, params: any, body: any): Observable<any> {
    if (!params) {
      return this.http.put(this.baseUrl + endPoint, body).pipe(
        catchError((error) => {
          if (error.status !== 200) {
            return throwError(error.error.message);
          }
        })
      );
    } else {
      return this.http.put(this.baseUrl + endPoint + '/' + params, body).pipe(
        catchError((error) => {
          if (error.status !== 200) {
            return throwError(error.error.message);
          }
        })
      );
    }
  }
}
