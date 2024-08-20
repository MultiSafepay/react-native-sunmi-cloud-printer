//
//  SunmiPrinterCommand.h
//  PrinterDemo
//
//  Created by SM2368 on 2022/10/17.
//  Copyright © 2022 mark. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import <SunmiPrinterSDK/SunmiPrinterHeader.h>

NS_ASSUME_NONNULL_BEGIN

@interface SunmiColumnSetting : NSObject

@property (nonatomic, assign) int width; // 分列打印的宽度
@property (nonatomic, assign) SMPrintMode mode; // 是否开启黑白翻转模式
@property (nonatomic, assign) SMAlignStyle alignment; // 对齐方式

@end

@interface SunmiPrinterCommand : NSObject

/**
 * sdk信息*
 */
+ (NSString *)getSDKVersion;

/**
 * 获取本地将要传送给打印机的缓存数据
 */
- (NSData *)getCommandData;

/**
 * 清除本地将要传送给打印机的缓存数据
 */
- (void)clearBuffer;

/**
 * 设置打印纸打印宽度
 */
- (void)setPrintWidth:(int)printWidth;

/**
 * 在本地缓存的内容添加自定义的指令内容
 */
- (void)appendRawData:(NSData *)data;

/**
 * 追加单个 unicode 码以及数量
 */
- (void)appendUnicode:(int)unicode
                count:(int)count;

/**
 * 追加文本字符串
 */
- (void)appendText:(NSString *)contentText;

/**
 * 打印数据并走纸 n 行
 */
- (void)lineFeed:(int)lines;

/**
 * 恢复打印机默认设置
 */
- (void)restoreDefaultSettings;

/**
 * 恢复默认行间距
 */
- (void)restoreDefaultLineSpacing;

/**
 * 设置行间距
 */
- (void)setLineSpacing:(int)lineSpace;

/**
 * 设置打印模式
 *
 * @param  bold  加粗
 * @param  double_h  倍高
 * @param  double_w  倍宽
 */
- (void)setPrintModesBold:(BOOL)bold
                 double_h:(BOOL)double_h
                 double_w:(BOOL)double_w;

/**
 * 设置字符大小
 *
 * @param  characterHeight  高度缩放（1-8）
 * @param  characterWidth  宽度缩放（1-8）
 */
- (void)setCharacterHeight:(int)characterHeight
           characterWidth:(int)characterWidth;

/**
 * 跳转 n 个制表符
 *
 * @param  tabs  个数
 */
- (void)horizontalTab:(int)tabs;

/**
 * 设置横向绝对位置
 *
 * @param  horizontalPosition 横向位置
 */
- (void)setAbsolutePrintPosition:(int)horizontalPosition;

/**
 * 设置横向相对位置
 *
 * @param horizontalPosition 横向位置
 */
- (void)setRelativePrintPosition:(int)horizontalPosition;

/**
 * 对齐方式
 *
 * @param alignment  枚举值
 */
- (void)setAlignment:(SMAlignStyle)alignment;

/**
 * 设置下划线模式
 *
 * @param  mode    枚举值
 */
- (void)setUnderlineMode:(SMUnderlineStyle)mode;

/**
 * 设置黑白翻转模式
 *
 * @param  enabled     YES/NO
 */
- (void)setBlackWhiteReverseMode:(BOOL)enabled;

/**
 * 设置上下颠倒模式
 *
 * @param  enabled     YES/NO
 */
- (void)setUpsideDownMode:(BOOL)enabled;

/**
 * 设置切纸模式
 *
 * @param  fullCut     YES 全切，NO 为 半切
 */
- (void)cutPaper:(BOOL)fullCut;

/**
 * 设置切纸模式，不依赖于行间距
 *
 * @param  fullCut     YES 全切，NO 为 半切
 */
- (void)autoCutPaper:(BOOL)fullCut;

/**
 * 设置切纸模式
 *
 * @param  fullCut     YES 全切，NO 为 半切
 * @param  delay     距离 （0-255）
 */
- (void)postponedCutPaper:(BOOL)fullCut
                    delay:(int)delay;

/**
 * 设置 CJK 编码
 *
 * @param  cjkEncoding     cjk模式
 */
- (void)setCjkEncoding:(int)cjkEncoding;

/**
 * 设置 utf8 模式
 *
 * @param  utf8Mode     utf8 模式
 */
- (void)setUtf8Mode:(int)utf8Mode;

/**
 * 设置 Latin 字体大小
 *
 * @param  charSize     字体大小
 */
- (void)setHarfBuzzAsciiCharSize:(int)charSize;

/**
 * 设置 CJK 字体大小
 *
 * @param  charSize     字体大小
 */
- (void)setHarfBuzzCjkCharSize:(int)charSize;

/**
 * 设置其他字体大小
 *
 * @param  charSize     字体大小
 */
- (void)setHarfBuzzOtherCharSize:(int)charSize;

/**
 * 设置 Latin 字体
 *
 * @param  charFont     Latin 字体
 */
- (void)selectAsciiCharFont:(int)charFont;

/**
 * 设置 CJK 字体
 *
 * @param  charFont     CJK 字体
 */
- (void)selectCjkCharFont:(int)charFont;

/**
 * 设置其他字体
 *
 * @param  charFont     其他字符使用的字库
 */
- (void)selectOtherCharFont:(int)charFont;

/**
 * 设置打印浓度
 *
 * @param  density     打印浓度（70~130）
 */
- (void)setPrintDensity:(int)density;

/**
 * 设置打印速度
 *
 * @param  speed     打印速度（0-250）
 */
- (void)setPrintSpeed:(int)speed;

/**
 * 设置切刀模式
 *
 * @param  mode     切刀模式（0，1，2，3）
 */
- (void)setCutterMode:(int)mode;

/**
 * 清除未取纸状态
 */
- (void)clearPaperNotTakenAlarm;

/**
 * 分列打印配置
 *
 * @param  settings     每个列的配置
 */
- (void)setupColumns:(NSArray <SunmiColumnSetting*>*)settings;

/**
 * 分列打印文本
 *
 * @param  texts     每列的文字
 */
- (void)printInColumns:(NSArray *)texts;

/**
 * 添加条形码
 *
 * @param  hri_pos  HRI 字符打印位置
 * @param  height  置条码高度（1-255）
 * @param  module_size  条码的模组宽度
 * @param  barcode_type  条码类型
 * @param  text  条码文本
 */
- (void)appendBarcode:(SMBarcodeReadable)hri_pos
               height:(int)height
          module_size:(int)module_size
         barcode_type:(SMBarcodeType)barcode_type
                 text:(NSString *)text;

/**
 * 添加二维码
 *
 * @param  module_size  二维码的模块大小
 * @param  ec_level  设置纠错等级
 * @param  text  二维码文本
 */
- (void)appendQRcode:(int)module_size
            ec_level:(SMErrorLevel)ec_level
                text:(NSString *)text;

/**
 * 添加图片
 *
 * @param  img  UIImage 对象
 * @param  mode  图片转换算法
 */
- (void)appendImage:(UIImage *)img
               mode:(SMImageAlgorithm)mode;

/**
 * 进入页模式
 */
- (void)enterPageMode;

/**
 * 设置页模式区域
 */
- (void)setPrintAreaInPageModeOriginalX:(int)originalX
                              originalY:(int)originalY
                                  width:(int)width
                                 height:(int)height;

/**
 * 设置页模块打印方向
 */
- (void)setPrintDirectionInPageMode:(SMPageModeDirection)printDirection;

/**
 * 设置页模式下纵向绝对位置
 */
- (void)setAbsolutePrintPositionInPageMode:(int)verticalPosition;

/**
 * 设置页模式下纵向相对位置
 */
- (void)setRelativePrintPositionInPageMode:(int)verticalPosition;

/**
 * 打印页模式打印机缓存数据并退出页模式
 */
- (void)printAndExitPageMode;

/**
 * 打印页模式打印机缓存数据
 */
- (void)printInPageMode;

/**
 * 清空页模式打印机缓存数据
 */
- (void)clearInPageMode;

/**
 * 退出页模式
 */
- (void)exitPageMode;

/**
 * 开钱箱
 */
- (void)openCashBox;

/**
 * 获取最近一个打印任务的编号
 */
- (void)getLastPrintTaskNumber;

/**
 * 获取打印状态
 */
- (void)getDeviceState;

/**
 * 获取打印机sn
 */
- (void)getDeviceSN;

/**
 * 进入配网模式
 */
- (void)enterNetworkMode:(NSString *)deviceSN;


@end

NS_ASSUME_NONNULL_END
