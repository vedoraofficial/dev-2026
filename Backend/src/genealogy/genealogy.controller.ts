import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GenealogyService } from './genealogy.service';
import { JoinPartnerDto } from './dto/join-partner.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Partner / Genealogy')
@Controller('partner')
export class GenealogyController {
  constructor(private readonly genealogyService: GenealogyService) {}

  @Post('join')
  @ApiOperation({ summary: 'Join as a new partner under a sponsor (referral VED ID)' })
  @ApiResponse({ status: 201, description: 'Partner joined successfully, slot allocated and 5 uplines mapped.' })
  @ApiResponse({ status: 400, description: 'Sponsor reached 20-partner limit or is inactive.' })
  @ApiResponse({ status: 404, description: 'Sponsor referral ID not found.' })
  @ApiResponse({ status: 409, description: 'Email or mobile already in use.' })
  async joinPartner(@Body() dto: JoinPartnerDto) {
    return this.genealogyService.joinPartner(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/genealogy')
  @ApiOperation({ summary: 'Get current logged-in partner tree node, direct downlines, and 5-level uplines' })
  async getMyGenealogy(@Request() req: any) {
    return this.genealogyService.getMyGenealogy(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':vedId/genealogy')
  @ApiOperation({ summary: 'Get genealogy tree details, direct downlines, and 5-level uplines by VED ID' })
  async getGenealogyByVedId(@Param('vedId') vedId: string) {
    return this.genealogyService.getGenealogyByVedId(vedId);
  }
}
