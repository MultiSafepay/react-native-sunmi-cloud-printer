//
//  SunmiPrinterIPManager.h
//  SMPrintLibary
//
//  Created by SM2368 on 2022/10/8.
//

#import <Foundation/Foundation.h>
#import <SunmiPrinterSDK/SunmiPrinterHeader.h>

/**
 * 发送数据成功
 */
typedef void(^SuccessBlock)(void);

/**
 * 发送数据失败
 *
 * @param error 错误信息
 */
typedef void(^FailureBlock)(NSError *error);

/**
 * 设备断开连接
 *
 * @param deviceSN 设备SN
 * @param printerStatus 设备状态
 * @param taskNumber 任务编码
 */
typedef void(^ResponseBlock)(NSString *deviceSN, SMPrinterStatus printerStatus, NSString *taskNumber);


@class SunmiIpPrinterModel;

@protocol IPPrinterManagerDelegate <NSObject>

@optional

/**
 * 搜索到的 IP 打印机设备
 *
 @param printerModel   打印机设备模型，详见 SunmiIpPrinterModel.h
*/
- (void)discoverIPPrinter:(SunmiIpPrinterModel *)printerModel;

/**
 * 搜索IP设备结束
 */
- (void)finshedSearchPrinter;

/**
 * 成功连接打印机
 */
- (void)didConnectedIPPrinter;

/**
 * 连接打印机失败
 */
- (void)didConnectedIPPrinterWithError:(NSError *)error;

@end


@interface SunmiPrinterIPManager : NSObject

@property (nonatomic, weak) id<IPPrinterManagerDelegate>delegate;

+ (instancetype)sharedManager;

/**
 * 搜索设备
 * 默认搜索全部设备（传 nil）
 *
 * @param searchPrinter   指定 ip 地址
 */
- (void)startSearchPrinterWithIp:(NSString *)searchPrinter;

/**
 * 连接设备
 *
 * @param ip 当前设备 ip
 */
- (void)connectSocketWithIP:(NSString *)ip;

/**
 * 设备连接断开了
 *
 * @param block   回调结果
 */
- (void)deviceDisConnectWithBlock:(void(^)(NSError *error))block;

/**
 * 当前 IP 设备连接状态
 */
- (BOOL)isConnectedIPService;

/**
 * 断开已连接的 IP 设备
 */
- (void)disConnectIPService;

/**
 * 向设备发送数据
 *
 * @param ipData 发送的数据
 * @param success 发送成功回调
 * @param fail 发送失败回调
 */
- (void)controlDevicePrintingData:(NSData *)ipData success:(SuccessBlock)success fail:(FailureBlock)fail;

/**
 * 向设备发送数据
 * 
 * @param ipData 发送的数据
 * @param success 发送成功回调
 * @param fail 发送失败回调
 * @param response 设备返回的数据
 */
- (void)controlDevicePrintingData:(NSData *)ipData success:(SuccessBlock)success fail:(FailureBlock)fail response:(ResponseBlock)response;


@end
