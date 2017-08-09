import 'reflect-metadata';
import 'zone.js';
import 'rxjs/add/operator/first';
import {APP_BASE_HREF} from '@angular/common';
import {enableProdMode, ApplicationRef, NgZone, ValueProvider} from '@angular/core';
import {platformDynamicServer, PlatformState, INITIAL_CONFIG} from '@angular/platform-server';
import {AppModule} from './app/app.module.server';

enableProdMode();

export default function (params: any) {
  return function (ctx: any): void {
    const providers = [
      {provide: INITIAL_CONFIG, useValue: {document: '<app></app>', url: params.url}},
      {provide: APP_BASE_HREF, useValue: params.baseUrl},
      {provide: 'BASE_URL', useValue: params.origin + params.baseUrl},
    ];

    platformDynamicServer(providers).bootstrapModule(AppModule).then(moduleRef => {
      const appRef: ApplicationRef = moduleRef.injector.get(ApplicationRef);
      const state = moduleRef.injector.get(PlatformState);
      const zone = moduleRef.injector.get(NgZone);

      zone.onError.subscribe((errorInfo: any) => ctx.fail(errorInfo));
      appRef.isStable.first(isStable => isStable).subscribe(() => {
        // Because 'onStable' fires before 'onError', we have to delay slightly before
        // completing the request in case there's an error to report
        setImmediate(() => {
          ctx
          // we define a hardcoded title for our application
            .put('title', 'Home Page')
            // server side rendering
            .put('ssr', state.renderToString());

          params.engine.render(ctx, "templates", "/index.hbs", (res: any) => {
            if (res.succeeded()) {
              ctx.response()
                .putHeader("Content-Type", 'text/html')
                .end(res.result());
            } else {
              ctx.fail(res.cause());
            }

            moduleRef.destroy();
          });
        });
      });
    });
  };
};
