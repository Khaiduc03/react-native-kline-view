#import "RNKLineView-Swift.h"
#import "RCTViewManager.h"


@interface RCT_EXTERN_MODULE(RNKLineView, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(onDrawItemDidTouch, RCTBubblingEventBlock)

RCT_EXPORT_VIEW_PROPERTY(onDrawItemComplete, RCTBubblingEventBlock)

RCT_EXPORT_VIEW_PROPERTY(onDrawPointComplete, RCTBubblingEventBlock)

RCT_EXPORT_VIEW_PROPERTY(optionList, NSString)

RCT_EXTERN_METHOD(setData:(nonnull NSNumber *)reactTag candles:(NSArray *)candles)
RCT_EXTERN_METHOD(appendCandle:(nonnull NSNumber *)reactTag candle:(NSDictionary *)candle)
RCT_EXTERN_METHOD(updateLastCandle:(nonnull NSNumber *)reactTag candle:(NSDictionary *)candle)

// Price Prediction Methods
RCT_EXTERN_METHOD(setPrediction:(nonnull NSNumber *)reactTag payload:(NSString *)payload)
RCT_EXTERN_METHOD(clearPrediction:(nonnull NSNumber *)reactTag)

@end

