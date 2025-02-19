/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { TypeDaprInvokerCallback } from '../../../types/DaprInvokerCallback.type';
import { InvokerListenOptionsType } from '../../../types/InvokerListenOptions.type';
import { HttpMethod } from '../../../enum/HttpMethod.enum';
import HTTPServer from './HTTPServer';
import IServerInvoker from '../../../interfaces/Server/IServerInvoker';

// https://docs.dapr.io/reference/api/service_invocation_api/
export default class HTTPServerInvoker implements IServerInvoker {
  private readonly server: HTTPServer;

  constructor(server: HTTPServer) {
    this.server = server;
  }

  async listen(methodName: string, cb: TypeDaprInvokerCallback, options: InvokerListenOptionsType = {}) {
    const serverMethod: HttpMethod = options?.method?.toLowerCase() as HttpMethod || HttpMethod.GET;

    const server = await this.server.getServer();
    // @TODO should pass rest of headers to callback
    server[serverMethod](`/${methodName}`, async (req, res) => {
      const invokeResponse = await cb({
        body: JSON.stringify(req.body),
        query: req.originalUrl,
        metadata: {
          contentType: req.headers['content-type']
        }
      });

      // Make sure we close the request after the callback
      // @TODO this should send header and http status code to client (same as grpc)

      if (!res.writableEnded) {
        if (invokeResponse) {
          return res.end(JSON.stringify(invokeResponse));
        } else {
          return res.end(JSON.stringify({ closed: true }));
        }
      }
    });

    console.log(`Listening on ${serverMethod.toUpperCase()} /${methodName}`);
  }
}
