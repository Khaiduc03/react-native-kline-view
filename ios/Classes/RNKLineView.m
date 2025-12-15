#import "RNKLineView-Swift.h"
#import "RCTViewManager.h"


@interface RCT_EXTERN_MODULE(RNKLineView, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(onDrawItemDidTouch, RCTBubblingEventBlock)

RCT_EXPORT_VIEW_PROPERTY(onDrawItemComplete, RCTBubblingEventBlock)

RCT_EXPORT_VIEW_PROPERTY(onDrawPointComplete, RCTBubblingEventBlock)

RCT_EXPORT_VIEW_PROPERTY(optionList, NSString)

RCT_EXTERN_METHOD(appendCandle:(nonnull NSNumber *)reactTag payload:(NSDictionary *)payload)

@end

