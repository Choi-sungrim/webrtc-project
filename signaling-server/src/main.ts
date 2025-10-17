import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  // const httpsOptions = {
  //   key: fs.readFileSync('./livekit.host.com+1-key.pem'),
  //   cert: fs.readFileSync('./livekit.host.com+1.pem'),
  // };

  // { httpsOptions }
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));

  const localAddr = '192.168.100.23';
  const localPort = 3000;
  const listenPort = 8181;
  const https = 'https://';
  const http = 'http://';
  app.enableCors({
    origin: [
      `${https}${localAddr}:${localPort}`,
      `${https}localhost:${localPort}`,
      `${http}${localAddr}:${localPort}`,
      `${http}localhost:${localPort}`,
    ],
    credential: false,
  });

  await app.listen(listenPort);
  console.log(`Signaling server running on ${http}${localAddr}:${listenPort}`);
}
bootstrap();
