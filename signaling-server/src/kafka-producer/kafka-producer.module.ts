import { Module } from '@nestjs/common';
import { KafkaProducerController } from './kafka-producer.controller';
import { KafkaProducerService } from './kafka-producer.service';

@Module({
  providers: [KafkaProducerService],
  controllers: [KafkaProducerController],
})
export class KafkaProducerModule {}
