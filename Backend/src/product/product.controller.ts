import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Product')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '[Admin] Create a new product' })
  @ApiResponse({ status: 201, description: 'Product successfully created.' })
  create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
    return this.productService.create(createProductDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  findById(@Param('id') id: string) {
    return this.productService.findById(+id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '[Admin] Update a product' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Request() req: any) {
    return this.productService.update(+id, updateProductDto, req.user.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '[Admin] Delete a product' })
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
