//
//  SunmiBlePrinterModel.h
//  SunmiPrinterManager
//
//  Created by Rking on 2020/2/26.
//  Copyright © 2020 Sunmi Wireless Department. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>

NS_ASSUME_NONNULL_BEGIN

@interface SunmiBlePrinterModel : NSObject

/**
 * 蓝牙设备
 */
@property (nonatomic, strong) CBPeripheral *peripheral;

/**
 * 信号强度
 */
@property (nonatomic, strong) NSNumber *rssi;

/**
 * 设备名称
 */
@property (nonatomic, copy) NSString *deviceName;

/**
 * 唯一标识
 */
@property (nonatomic, copy) NSString *uuidString;

/**
 * 初始化方法
*/
- (instancetype)initWithPeripheral:(CBPeripheral *)cbPeripheral
                 advertisementData:(NSDictionary *)advertisementData
                              RSSI:(NSNumber *)RSSI;

@end

NS_ASSUME_NONNULL_END
