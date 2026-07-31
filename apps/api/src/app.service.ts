import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: 'Quill API',
      version: '1.0.0',
      description: 'Creative Writing & Story Development Platform',
      docs: '/docs',
    };
  }
}
