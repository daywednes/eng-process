import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseUtil, ApiResponse } from '../utils/response.util';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already formatted as ApiResponse, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        // Otherwise, wrap in success response
        return ResponseUtil.success(data);
      }),
    );
  }
}

