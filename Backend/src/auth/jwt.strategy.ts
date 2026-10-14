import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { UserStatus } from '../user/entity/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'supersecretjwtkey_change_in_production',
    });
  }

  async validate(payload: any) {
    let user;
    try {
      user = await this.userService.findById(payload.sub);
    } catch {
      throw new UnauthorizedException('User session is invalid or user no longer exists');
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException('User account has been blocked');
    }

    return { sub: user.id, vedId: user.vedId, role: user.role, status: user.status };
  }
}

