#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNKLineView, NSObject)

// ----- Imperative commands (Phase 1) -----
RCT_EXTERN_METHOD(setData:(nonnull NSNumber *)reactTag candles:(NSArray *)candles)
RCT_EXTERN_METHOD(appendCandle:(nonnull NSNumber *)reactTag candle:(NSDictionary *)candle)
RCT_EXTERN_METHOD(updateLastCandle:(nonnull NSNumber *)reactTag candle:(NSDictionary *)candle)

// ----- Price Prediction overlay (Phase 2 - iOS only) -----
RCT_EXTERN_METHOD(setPrediction:(nonnull NSNumber *)reactTag payload:(NSDictionary *)payload)
RCT_EXTERN_METHOD(clearPrediction:(nonnull NSNumber *)reactTag)

@end

