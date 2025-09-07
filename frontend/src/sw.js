import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

precacheAndRoute(self.__WB_MANIFEST || []);

registerRoute(/\/api\//, new NetworkFirst());
registerRoute(/\.(mp4|webm)$/, new StaleWhileRevalidate());