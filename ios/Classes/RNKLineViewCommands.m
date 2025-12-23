#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNKLineViewCommands, NSObject)

RCT_EXTERN_METHOD(setData:(nonnull NSNumber *)reactTag candles:(NSArray *)candles)
RCT_EXTERN_METHOD(appendCandle:(nonnull NSNumber *)reactTag candle:(NSDictionary *)candle)
RCT_EXTERN_METHOD(updateLastCandle:(nonnull NSNumber *)reactTag candle:(NSDictionary *)candle)

// Price Prediction Commands
RCT_EXTERN_METHOD(setPrediction:(nonnull NSNumber *)reactTag payload:(NSString *)payload)
RCT_EXTERN_METHOD(clearPrediction:(nonnull NSNumber *)reactTag)

@end

