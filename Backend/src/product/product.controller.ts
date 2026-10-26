import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { PRODUCT_IMAGE_MAX_BYTES, ProductImageService, UploadedImage } from './product-image.service';
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
  constructor(
    private readonly productService: ProductService,
    private readonly productImageService: ProductImageService,
  ) {}

  @Post(':id/image')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  // Kept in memory (≤ 3 MB) and stored in the database — nothing is written to the server's disk.
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: PRODUCT_IMAGE_MAX_BYTES, files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: '[Admin] Upload / replace the product photo (JPG, PNG or WebP, max 3 MB)' })
  uploadImage(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: UploadedImage) {
    return this.productImageService.upload(id, file);
  }

  @Delete(':id/image')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '[Admin] Remove the product photo' })
  removeImage(@Param('id', ParseIntPipe) id: number) {
    return this.productImageService.remove(id);
  }

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
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '[Admin] Update a product' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto, @Request() req: any) {
    return this.productService.update(id, updateProductDto, req.user.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: '[Admin] Delete a product' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
