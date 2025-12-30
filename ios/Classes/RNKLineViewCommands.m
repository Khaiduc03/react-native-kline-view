#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNKLineViewCommands, NSObject)

RCT_EXTERN_METHOD(setData:(nonnull NSNumber *)reactTag candles:(NSArray *)candles)
RCT_EXTERN_METHOD(appendCandle:(nonnull NSNumber *)reactTag candle:(NSDictionary *)candle)
RCT_EXTERN_METHOD(updateLastCandle:(nonnull NSNumber *)reactTag candle:(NSDictionary *)candle)
RCT_EXTERN_METHOD(unPredictionSelect:(nonnull NSNumber *)reactTag unused:(id)unused)

@end

