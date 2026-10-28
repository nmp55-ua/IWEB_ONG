import { crearApp } from './app.js';
import { config } from './config.js';

crearApp().listen(config.puerto, () => {
  console.log(`API escuchando en http://localhost:${config.puerto}/api`);
});
