//
//  SunmiPrinterManager.h
//  SunmiPrinterManager
//
//  Created by Rking on 2020/2/26.
//  Copyright © 2020 Sunmi Wireless Department. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <SunmiPrinterSDK/SunmiPrinterHeader.h>

@class SunmiBlePrinterModel;

/**
 * 设备断开连接
 *
 * @param device 设备
 * @param err 错误信息
 */
typedef void (^disConnectionDeviceBlock)(CBPeripheral *_Nullable device, NSError *_Nonnull err);

/**
 * 发送数据成功
 */
typedef void (^sendDeviceDataSuccessBlock)(void);

/**
 * 发送数据失败
 *
 * @param err 错误信息
 */
typedef void (^sendDeviceDataFailBlock)(NSError *_Nullable err);

/**
 * 接收数据
 *
 * @param deviceSN 设备 SN
 * @param printerStatus 打印机状态
 * @param taskNumber 任务编号
 */
typedef void (^receivedDeviceDataBlock)(NSString * _Nullable deviceSN, SMPrinterStatus printerStatus, NSString * _Nullable taskNumber);


@protocol PrinterManagerDelegate <NSObject>

@optional

/**
 * 连接打印机蓝牙成功的回调
 */
- (void)didConectPrinter;

/**
 * 进入蓝牙配网模式
 */
- (void)didEnterNetworkMode;

/**
 * 和打印机蓝牙断开的回调
 */
- (void)willDisconnectPrinter;

/**
 * 搜索到的打印机设备
 *
 * @param device    打印机设备模型，详见 SunmiPrinterDeviceModel.h
*/
- (void)discoveredDevice:(SunmiBlePrinterModel *_Nonnull)device;

/**
 * 搜索蓝牙外设结束
 */
- (void)didCancelSearching;

/**
 * 开始获取设备sn，可以使用此方法建立超时机制
 */
- (void)willStartReceiveDeviceSn;

/**
 * 获取到sn的回调
 */
- (void)receiveDeviceSn:(NSString *_Nullable)sn;

/**
 * 接收到的Wi-Fi信息
 */
- (void)receiveAPInfo:(NSDictionary *_Nullable)apInfo;

/**
 * 接收Wi-Fi列表完毕
 */
- (void)didReceiveAllApInfo;

/**
 * 接收Wi-Fi信息失败
 */
- (void)didFailReceiveApInfo;

/**
 * 开始设置Wi-Fi
 */
- (void)willStartConfigPrinter;

/**
 * 设置Wi-Fi成功
 */
- (void)configPrinterSuccess;

/**
 * 设置Wi-Fi失败
 */
- (void)configPrinterFail;

@end


@interface SunmiPrinterManager : NSObject

@property(nonatomic, weak) id<PrinterManagerDelegate> _Nullable bluetoothDelegate;

+ (instancetype _Nonnull)shareInstance;

+ (void)instanceDealloc;

/**
 *  是否蓝牙可用
 */
- (BOOL)getDeviceBluetoothAvailable;

/**
 * 此状态可以控制本机蓝牙状态更新后是否可以扫描连接外设
 */
- (void)setDeviceSearchState:(BOOL)canSearchDevice;

/**
 * 蓝牙是否连接
 */
- (BOOL)bluetoothIsConnection;

/**
 * 搜索蓝牙设备
 */
- (void)scanPeripheral;

/**
 * 取消搜索蓝牙设备
 */
- (void)cancelScan;

/**
 * 连接蓝牙设备
 *
 * @param peripheral     要连接的外设
 */
- (void)connectPeripheral:(CBPeripheral *_Nonnull)peripheral;

/**
 * 断开连接蓝牙设备
 */
- (void)disConnectPeripheral;

/**
 * 设备连接断开了
 *
 * @param block   回调
 */
- (void)deviceDisConnectWithBlock:(disConnectionDeviceBlock _Nullable)block;

/**
 * 获取打印机SN号（进入配网模式后才能拿到 SN 数据）
 */
- (void)getPrinterSN;

/**
 * 进入配网模式
 */
- (void)enterNetworkMode:(NSString *_Nullable)deviceSN;

/**
 * 获取wifi列表
 */
- (void)getWifiList;

/**
 * 给打印机配置Wi-Fi网络
 *
 * @param ssid    Wi-Fi名称
 * @param password    Wi-Fi密码
*/
- (void)connectAP:(NSString *_Nonnull)ssid
         password:(NSString *_Nullable)password;

/**
 * 配网成功的通知
 */
- (void)connectAPSuccess;

/**
 * 退出配网过程
 */
- (void)quitConnectAP;

/**
 * 删除 wifi 配置
 */
- (void)deleteWifiSetting;

/**
 * 向设备发送指令
 */
-(void)sendPrintData:(NSData *_Nullable)data;

/**
 * 发送数据成功
 */
- (void)sendSuccess:(sendDeviceDataSuccessBlock _Nullable )block;

/**
 * 发送数据失败
 */
- (void)sendFail:(sendDeviceDataFailBlock _Nullable )block;

/**
 * 接收打印机返回数据
 */
- (void)receivedDeviceData:(receivedDeviceDataBlock _Nullable )block;

@end
