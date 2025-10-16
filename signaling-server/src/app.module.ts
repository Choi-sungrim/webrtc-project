import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SignalingModule } from './signaling/signaling.module';
import { LivekitService } from './livekit/livekit.service';
import { LivekitModule } from './livekit/livekit.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    SignalingModule,
    LivekitModule,
  ],
  controllers: [AppController],
  providers: [AppService, LivekitService],
})
export class AppModule {}
