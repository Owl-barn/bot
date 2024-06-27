import { state } from "@app";
import { EndpointActions } from "@structs/endpoint";
import fs from "fs/promises";

export async function loadEndpoints(path: string) {
  const files = await fs.readdir(path, { withFileTypes: true });
  let loadedEndpoints = 0;

  for (const file of files) {
    if (!file.isFile()) continue;
    if (!file.name.endsWith(".js")) continue;

    const endpoint = (await import(`${path}/${file.name}`)).default as EndpointActions;

    if (!endpoint) throw "No default export found for " + path;

    // Configure the endpoints.
    if (endpoint.GET) {
      state.webServer.get(`/${endpoint.GET.name}`, endpoint.GET.run);
    }

    if (endpoint.POST) {
      state.webServer.post(`/${endpoint.POST.name}`, endpoint.POST.run);
    }

    if (endpoint.PUT) {
      state.webServer.put(`/${endpoint.PUT.name}`, endpoint.PUT.run);
    }

    if (endpoint.DELETE) {
      state.webServer.delete(`/${endpoint.DELETE.name}`, endpoint.DELETE.run);
    }

    if (endpoint.PATCH) {
      state.webServer.patch(`/${endpoint.PATCH.name}`, endpoint.PATCH.run);
    }

    if (endpoint.OPTIONS) {
      state.webServer.options(`/${endpoint.OPTIONS.name}`, endpoint.OPTIONS.run);
    }

    if (endpoint.HEAD) {
      state.webServer.head(`/${endpoint.HEAD.name}`, endpoint.HEAD.run);
    }

    loadedEndpoints++;
  }


  console.log(
    " - Loaded ".green +
    String(loadedEndpoints).cyan +
    " endpoints".green,
  );

}
