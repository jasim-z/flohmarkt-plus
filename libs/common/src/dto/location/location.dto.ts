import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsLatitude, IsLongitude, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

export class LocationUpdateDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}

export class LocationSearchResultDto {
  @IsString()
  displayName: string;

  @IsString()
  address: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lon: number;

  @IsString()
  placeId: string;

  @IsString()
  type: string;

  @IsNumber()
  importance: number;
}

export class LocationSearchResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationSearchResultDto)
  results: LocationSearchResultDto[];
}

export class ReverseGeocodeDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lon: number;
}

export class ReverseGeocodeResponseDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationSearchResultDto)
  result?: LocationSearchResultDto;
}

export class MarketSearchByLocationDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  radiusKm?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
