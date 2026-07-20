import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { HumanModule } from './human/human.module';
import { HumanListModule } from './human-list/human-list.module';
import { CameraModule } from './camera/camera.module';
import { ChannelModule } from './channel/channel.module';
import { LocationModule } from './location/location.module';
import { MeetingModule } from './meeting/meeting.module';
import { MediaController } from './media/media.controller';
import { LovadModule } from './lovad/lovad.module';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    HumanModule,
    HumanListModule,
    CameraModule,
    ChannelModule,
    LocationModule,
    MeetingModule,
    LovadModule,
  ],
  controllers: [MediaController],
})
export class AppModule {}

