import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsVendorBoothRatioValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isVendorBoothRatioValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const market = args.object as any;
          const vendorLimit = market.vendorLimit;
          const boothsAvailable = value;

          // If both values are provided, they must be equal for 1:1 allocation
          if (vendorLimit !== undefined && boothsAvailable !== undefined) {
            return vendorLimit === boothsAvailable;
          }

          // If only one value is provided, it's valid (the other will be auto-set)
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const market = args.object as any;
          const vendorLimit = market.vendorLimit;
          const boothsAvailable = args.value;

          if (vendorLimit !== undefined && boothsAvailable !== undefined) {
            return `Vendor limit (${vendorLimit}) and booths available (${boothsAvailable}) must be equal for 1:1 allocation`;
          }

          return 'Invalid vendor to booth ratio';
        }
      }
    });
  };
} 