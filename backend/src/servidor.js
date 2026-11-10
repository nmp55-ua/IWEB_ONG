import { crearApp } from './app.js';
import { config } from './config.js';
import { programarCertificados } from './modulos/certificados-informes/tarea.js';

crearApp().listen(config.puerto, () => {
  console.log(`API escuchando en http://localhost:${config.puerto}/api`);
});
programarCertificados(); // spec-003: cada hora en el minuto 5 (Europe/Madrid)
