//
//  SunmiPrinterHeader.h
//  SunmiPrinterSDK
//
//  Created by SM2368 on 2023/5/8.
//

#ifndef SunmiPrinterHeader_h
#define SunmiPrinterHeader_h

/**
 * 对齐方式
 */
typedef enum : NSInteger {
    SMAlignStyle_Left = 0, // 左对齐
    SMAlignStyle_Center,   // 居中对齐
    SMAlignStyle_Right     // 右对齐
} SMAlignStyle;

/**
 * 条码内容可读位置
 */
typedef enum : NSInteger {
    SMBarcodeReadable_Hide = 0,  // 隐藏
    SMBarcodeReadable_Above,     // 条码上方
    SMBarcodeReadable_Below,     // 条码下方
    SMBarcodeReadable_Both       // 条码上下
} SMBarcodeReadable;

/**
 * 条码类型
 */
typedef enum : NSInteger {
    SMBarcodeType_UPCA = 65, // UPC-A条码商品条码是纯数字,位数是11位在编码过后外加一位校验码，组成12位数字,主要在美国和加拿大使用
    SMBarcodeType_UPCE,     // UPC-E条码商品条码是纯数字，是由UPC-A缩减而成，位数是7位，而且首位必须为0在编码过后外加一位校验码，组成8位数字
    SMBarcodeType_EAN13,    // EAN13商品条码是纯数字，而且位数是12位在编码过后外加一位校验码，组成13位数字
    SMBarcodeType_EAN8,     // EAN8商品条码是纯数字，而且位数是7位在编码过后外加一位校验码，组成8位数字
    SMBarcodeType_CODE39,   // Code39条码生成字符集包括数字 、大写字母以及- . $ / + % * 空格等字符其中"*"只用于标记开始和结束
    SMBarcodeType_ITF,      // 交叉25码（Interleaved 2 of 5）条码生成，常用于物流管理字符集仅为数字且个数为偶数,为奇数将自动在前面加"0"
    SMBarcodeType_CODABAR,  // 库德巴码（Codabar）条码生成，字符集包括数字和- $ : /. + 以及ABCD等字符其中ABCD只用于开始或者结尾，作为标识符使用
    SMBarcodeType_CODE93,   // Code93条码生成是 full ASCII 模式，可使用ASCII全部128个字符
    SMBarcodeType_CODE128   // 组合code128a、code128b、code128c，需根据码内容动态切换
} SMBarcodeType;

/**
 * 二维码纠错等级
 */
typedef enum : NSInteger {
    SMErrorLevel_L = 0,  // 纠错等级L 7%
    SMErrorLevel_M,      // 纠错等级M 15%
    SMErrorLevel_Q,      // 纠错等级Q 25%
    SMErrorLevel_H       // 纠错等级H 30%
} SMErrorLevel;

/**
 * 图片转换算法
 */
typedef enum : NSInteger {
    SMImageAlgorithm_BINARIZATION = 0,  // 二值化算法
    SMImageAlgorithm_DITHERING          // 抖动灰度算法
} SMImageAlgorithm;

/**
 * 设置页模式打印方向
 */
typedef enum : NSInteger {
    SMPageModeDirection_Original = 0,  // 不旋转
    SMPageModeDirection_1,             // 顺时针旋转90度
    SMPageModeDirection_2,             // 顺时针旋转180度
    SMPageModeDirection_3              // 顺时针旋转270度
} SMPageModeDirection;

/**
 * 黑白翻转
 */
typedef enum : int {
    SMPrintModel_Original = 0,
    SMPrintModel_BW_Reverse
} SMPrintMode;

/**
 * 下划线模式
 */
typedef enum : int {
    SMUnderlineStyle_Empty = 0, // 取消下划线
    SMUnderlineStyle_One, // 一点粗
    SMUnderlineStyle_Two // 两点粗
} SMUnderlineStyle;

/**
 * 返回状态枚举定义
 */
typedef enum : NSInteger {
    SMPrinterStatus_Printing = 1,
    SMPrinterStatus_NoPaper,
    SMPrinterStatus_RollIsExhausted,
    SMPrinterStatus_PaperJam,
    SMPrinterStatus_NoPaperPickup,
    SMPrinterStatus_CoverOpened,
    SMPrinterStatus_HeadOverheating,
    SMPrinterStatus_MotorOverheating
} SMPrinterStatus;

#endif /* SunmiPrinterHeader_h */
