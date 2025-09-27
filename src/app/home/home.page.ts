import { Component, AfterViewInit } from '@angular/core';
import { AlertController } from '@ionic/angular'; 
import * as L from 'leaflet';
 
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements AfterViewInit{

  
  map!: L.Map;
  marker!: L.Marker;
  
  constructor(private alertController: AlertController) {}

  ngAfterViewInit() {
    this.loadMap();
  }
  
  loadMap(){
    //Utilizando a API de Geolocalização do navegador
    if (navigator.geolocation){
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // inicializar o mapa
        this.map = L.map('map').setView([lat, lon], 13);
        
        // Adicionar o layer OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: 'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(this.map);
        
        // Adicionar um marcador com a posição atual
        this.marker = L.marker([lat, lon]).addTo(this.map)
        .bindPopup('Você está aqui!')
        .openPopup();

      },(error) => {
        console.error('Error getting location:', error);
      });
    } else {
      console.error('Geolocations is not supported by this browser.');
    }
  }

    // Função do botão para encontrar restaurantes próximos
    findRestaurant(){
      if (!this.map) return;

      const center = this.map.getCenter();
      this.loadNearbyRestaurants(center.lat, center.lng);
    }

    // Busca restaurantes pela API Overpass
    loadNearbyRestaurants(lat: number, lon: number) {
      const overpassUrl = `
      https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="restaurant"](around:1000,${lat},${lon});
      out;
      `.replace(/\s+/g, ''); // Remove espaços em branco

      fetch(overpassUrl)
        .then(res => res.json())
        .then(data => {
          data.elements.forEach((el: any) => {
            if (el.lat && el.lon) {
              const nome = el.tags?.name || 'Restaurante sem nome';
              const cozinha = el.tags?.cuisine ? `<b>Cozinha:</b> ${el.tags.cuisine}` : '';
              const endereco = el.tags?.[`addr:street`]
                ? `<b>Endereço:</b> ${el.tags?.[`addr:street`]}, ${el.tags?.[`addr:housenumber`] || ''}`
                : '';
              const telefone = el.tags?.phone ? `<b>Tel:</b> ${el.tags?.phone}` : '';

              const popupContent = `
                <b>${nome}</b><br/><br/>
                ${cozinha}<br/>
                ${endereco}<br/>
                ${telefone}
              `;

              L.marker([el.lat, el.lon])
                .addTo(this.map)
                .bindPopup(popupContent);
            }
          });
        });
    }

  // Função para mostrar um alerta 
  async showExplanation() { 
  
  // Criamos o alerta com título, mensagem e botões 
  const alert = await this.alertController.create({ 
    header: 'Explicação do uso de GPS', 
    subHeader: 'O app usa o GPS do dispositivo (via Geolocation API) pra pegar sua posição atual (latitude e longitude). Essas coordenadas são jogadas no mapa (Leaflet, Google Maps ou outro), que atualiza o marcador conforme a posição muda. Assim, o usuário vê em tempo real onde está e pode se localizar no mapa. Para buscar os restaurantes mais próximos, utiliza-se a API pública Overpass Turbo, que consulta o banco de dados do OpenStreetMap para encontrar restaurantes num raio de 1km da localização atual do usuário.', 
    message: 'Compreendeu?', 
    buttons: [ 
      { 
        text: 'Sim!', 
        handler: () => { 
          console.log('Botão Sim clicado'); 
        } 
      } 
    ] 
  }); 
  
  // Exibe o alerta na tela 
  await alert.present(); 
  } 

  // Alerta sobre permissão de GPS
  async showAlert() {
  
  const alert = await this.alertController.create({
    header: 'Permissão de GPS',
    subHeader: 'O app precisa da sua localização ativada para que funcione corretamente.',
    message: 'Por favor, ative a localização do seu dispositivo e permita o acesso ao GPS para que o app funcione corretamente.',
    buttons: [
      {
        text: 'Entendi',
        handler: () => {
          console.log('Permissão concedida');
        }
      }
    ]
  });
    
  await alert.present();
  }
}