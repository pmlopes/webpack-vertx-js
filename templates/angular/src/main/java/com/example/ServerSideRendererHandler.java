package com.example;

import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.ext.web.RoutingContext;
import jdk.nashorn.api.scripting.AbstractJSObject;
import jdk.nashorn.api.scripting.JSObject;

import javax.script.*;
import java.util.HashMap;
import java.util.Map;

public class ServerSideRendererHandler implements Handler<RoutingContext> {

  private final ScriptEngine engine;
  private final Map<String, Object> scriptContext = new HashMap<>();

  private JSObject handler;

  public ServerSideRendererHandler(Vertx vertx) throws ScriptException, NoSuchMethodException {
    // create a engine instance
    engine = new ScriptEngineManager().getEngineByName("nashorn");

    final Bindings engineBindings = engine.getBindings(ScriptContext.ENGINE_SCOPE);
    // remove the exit and quit functions
    engineBindings.remove("exit");
    engineBindings.remove("quit");

    // load polyfills
    ((Invocable) engine).invokeFunction("load", "classpath:polyfill.js");
  }

  public ServerSideRendererHandler put(String key, Object value) {
    scriptContext.put(key, value);
    return this;
  }

  public ServerSideRendererHandler loadScripts(String... scripts) throws ScriptException, NoSuchMethodException {
    JSObject module = null;
    for (String script : scripts) {
      // the ret object should the the last module, it should return a JSObject or null
      module = (JSObject) ((Invocable) engine).invokeFunction("load", script);
    }
    if (module != null) {
      JSObject bootFunc = null;

      if (module.isFunction() || module.isStrictFunction()) {
        bootFunc = module;
      } else if (!module.isArray()) {
        // if module is a JS Object then we need to get its default field (ES6 notation for export)
        bootFunc = (JSObject) module.getMember("default");
      }

      if (bootFunc != null) {
        // boot the handler
        JSObject renderer = (JSObject) bootFunc.call(null, scriptContext);
        // the renderer must be a function
        if (renderer.isStrictFunction() || renderer.isFunction()) {
          this.handler = renderer;
          return this;
        }
      }
    }

    throw new ScriptException("module does not export default function returing function: (params) : () => void");
  }

  @Override
  public void handle(RoutingContext ctx) {
    try {
      handler.call(null, ctx);
    } catch (RuntimeException e) {
      ctx.fail(e);
    }
  }
}
