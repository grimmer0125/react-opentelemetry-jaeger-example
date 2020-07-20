// Stalk comes with opentracing built-in
import * as StalkOpentracing from "stalk-opentracing";

const opentracing = StalkOpentracing.opentracing;
const stalk = StalkOpentracing.stalk;
const sleep = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration));

export async function testTracing() {
  try {
    const stalkTracer = new stalk.Tracer();
    opentracing.initGlobalTracer(stalkTracer);
    const globalTracer = opentracing.globalTracer();

    const USERNAME = "";
    const PASSWORD = "";
    const SERVER_URL = "";

    // Let's create a jaeger reporter
    const jaegerReporter = new stalk.reporters.JaegerReporter({
      // Jaeger collector base url
      jaegerBaseUrl: SERVER_URL, //"http://localhost:14268",
      requestHeaders: {
        Authorization:
          "Basic " +
          btoa(unescape(encodeURIComponent(USERNAME + ":" + PASSWORD))),
      },
      process: {
        serviceName: "my-awesome-service2",
        // Optional process tags
        tags: {
          tag1: "value1",
          tag2: "value2",
        },
      },

      // If you're on node.js use `node-fetch` package
      // fetch: require('node-fetch')
      fetch: window.fetch.bind(window),

      // Extra http headers
      // requestHeaders: {},
    });

    // Add this reporter to stalk.Tracer
    stalkTracer.addReporter(jaegerReporter);

    // You can remove it anytime you want
    // stalkTracer.removeReporter(jaegerReporter);

    const span = globalTracer.startSpan("main()");
    span.addTags({
      tag1: "value1",
      tag2: "value2",
    });

    span.log({ message: "Will wait 1 second" });
    await sleep(1000);
    await printHello(span, globalTracer);
    span.finish();

    await jaegerReporter.report();
    console.log("Reported!");
  } catch (err) {
    console.error(`Could not reported`, err);
  }
}

async function printHello(parentSpan, globalTracer) {
  const span = globalTracer.startSpan("printHello()", {
    childOf: parentSpan,
  });
  span.log({ message: "Will wait 500ms more, because I can" });
  await sleep(500);
  console.log("Hello world!");
  span.finish();
}
