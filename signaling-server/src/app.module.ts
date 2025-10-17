import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SignalingModule } from './signaling/signaling.module';
import { LivekitService } from './livekit/livekit.service';
import { LivekitModule } from './livekit/livekit.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { KafkaProducerModule } from './kafka-producer/kafka-producer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    SignalingModule,
    LivekitModule,
    RedisModule,
    KafkaProducerModule,
  ],
  controllers: [AppController],
  providers: [AppService, LivekitService],
})
export class AppModule {}
