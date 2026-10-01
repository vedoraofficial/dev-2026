import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GenealogyService } from './genealogy.service';
import { JoinPartnerDto } from './dto/join-partner.dto';
import { RegisterPartnerBySponsorDto } from './dto/register-partner-by-sponsor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Partner / Genealogy')
@Controller('partner')
export class GenealogyController {
  constructor(private readonly genealogyService: GenealogyService) {}

  @Post('join')
  @ApiOperation({ summary: 'Public join as a new partner under a sponsor (referral VED ID)' })
  @ApiResponse({ status: 201, description: 'Partner joined successfully, slot allocated and 5 uplines mapped.' })
  @ApiResponse({ status: 400, description: 'Sponsor reached 20-partner limit or is inactive.' })
  @ApiResponse({ status: 404, description: 'Sponsor referral ID not found.' })
  @ApiResponse({ status: 409, description: 'Email or mobile already in use.' })
  async joinPartner(@Body() dto: JoinPartnerDto) {
    return this.genealogyService.joinPartner(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('register-downline')
  @ApiOperation({
    summary: 'Register a new downline partner directly from own login (optional manual slotNumber 1-20)',
  })
  @ApiResponse({ status: 201, description: 'Partner registered and assigned to specified/next slot.' })
  @ApiResponse({ status: 400, description: 'Slot already occupied or 20-partner limit reached.' })
  async registerDownline(@Request() req: any, @Body() dto: RegisterPartnerBySponsorDto) {
    return this.genealogyService.registerPartnerBySponsor(req.user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-slots')
  @ApiOperation({
    summary: 'Get all 20 slots of logged-in user with occupied partner details (names, VED IDs, status)',
  })
  async getMySlots(@Request() req: any) {
    return this.genealogyService.getMySlots(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me/genealogy')
  @ApiOperation({ summary: 'Get current logged-in partner tree node, direct downlines, and 5-level uplines' })
  async getMyGenealogy(@Request() req: any) {
    return this.genealogyService.getMyGenealogy(req.user.sub);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':vedId/genealogy')
  @ApiOperation({ summary: '[Admin] Get direct partners below a specific user by VED ID' })
  async getGenealogyByVedId(@Param('vedId') vedId: string) {
    return this.genealogyService.getGenealogyByVedId(vedId);
  }
}
