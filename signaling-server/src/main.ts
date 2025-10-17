import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('./livekit.host.com+1-key.pem'),
    cert: fs.readFileSync('./livekit.host.com+1.pem'),
  };

  const app = await NestFactory.create(AppModule, { httpsOptions });
  app.useWebSocketAdapter(new IoAdapter(app));

  const localAddr = '192.168.100.20';
  const localPort = 3000;
  const listenPort = 8181;
  const https = 'https://';
  app.enableCors({
    origin: [
      `${https}${localAddr}:${localPort}`,
      `${https}localhost:${localPort}`,
    ],
    credential: true,
  });

  await app.listen(listenPort);
  console.log(`Signaling server running on ${https}${localAddr}:${listenPort}`);
}
bootstrap();
