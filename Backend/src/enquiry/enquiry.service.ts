import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enquiry, EnquiryStatus } from './entity/enquiry.entity';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';

@Injectable()
export class EnquiryService {
  constructor(
    @InjectRepository(Enquiry)
    private readonly enquiryRepo: Repository<Enquiry>,
  ) {}

  /** Saves a message sent from the website's contact page. */
  async create(dto: CreateEnquiryDto) {
    const saved = await this.enquiryRepo.save(
      this.enquiryRepo.create({
        name: dto.name,
        mobile: dto.mobile,
        email: dto.email.toLowerCase(),
        reference: dto.reference || null,
        topic: dto.topic,
        message: dto.message,
        status: EnquiryStatus.NEW,
      }),
    );
    return { id: saved.id, message: 'Thank you — our team will contact you shortly.' };
  }

  /** Every message, newest first (optionally only NEW or CONTACTED). */
  findAll(status?: EnquiryStatus) {
    return this.enquiryRepo.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      take: 500,
    });
  }

  async updateStatus(id: number, status: EnquiryStatus) {
    const enquiry = await this.enquiryRepo.findOne({ where: { id } });
    if (!enquiry) throw new NotFoundException('Message not found.');
    enquiry.status = status;
    return this.enquiryRepo.save(enquiry);
  }
}
