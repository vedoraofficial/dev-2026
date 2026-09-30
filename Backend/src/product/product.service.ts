import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entity/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto, userId: number): Promise<Product> {
    const product = this.productRepo.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.productRepo.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: number, dto: UpdateProductDto, userId: number): Promise<Product> {
    const product = await this.findById(id);
    
    Object.assign(product, dto);
    product.updatedBy = userId;

    return this.productRepo.save(product);
  }

  async remove(id: number): Promise<{ message: string }> {
    const product = await this.findById(id);
    await this.productRepo.remove(product);
    return { message: 'Product deleted successfully' };
  }
}
