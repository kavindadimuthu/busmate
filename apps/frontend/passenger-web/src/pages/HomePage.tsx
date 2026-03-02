import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchForm from "@/components/search/SearchForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, Clock, MapPin, Star, Users, Shield, Zap } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="h-screen bg-gradient-hero relative overflow-hidden flex items-center">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero-bg-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Your Journey Starts with
              <span className="block bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                BusMate
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
              Real-time bus information, route planning, and live tracking for Sri Lanka's public transportation
            </p>
            
            {/* Hero Search */}
            <div className="max-w-5xl mx-auto">
              <SearchForm />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Choose BusMate?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience the future of public transportation with our comprehensive platform
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card className="p-6 text-center hover:shadow-soft transition-all duration-300 border border-border">
                <CardContent className="p-0">
                  <div className="p-3 rounded-full bg-gradient-primary w-fit mx-auto mb-4">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Real-time Updates</h3>
                  <p className="text-muted-foreground">
                    Get live bus locations, arrival times, and route updates to plan your journey perfectly
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 text-center hover:shadow-soft transition-all duration-300 border border-border">
                <CardContent className="p-0">
                  <div className="p-3 rounded-full bg-gradient-secondary w-fit mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Smart Route Planning</h3>
                  <p className="text-muted-foreground">
                    Find the fastest routes, compare options, and discover the most convenient connections
                  </p>
                </CardContent>
              </Card>

              <Card className="p-6 text-center hover:shadow-soft transition-all duration-300 border border-border">
                <CardContent className="p-0">
                  <div className="p-3 rounded-full bg-gradient-primary w-fit mx-auto mb-4">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Lightning Fast</h3>
                  <p className="text-muted-foreground">
                    Quick search results and instant updates to keep you moving without delays
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-t border-border">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
                <div className="text-muted-foreground">Bus Routes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary mb-2">50K+</div>
                <div className="text-muted-foreground">Daily Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">25</div>
                <div className="text-muted-foreground">Cities Covered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-secondary mb-2">4.8</div>
                <div className="text-muted-foreground">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Popular Routes
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { from: "Colombo Fort", to: "Kandy", duration: "3h 15m", buses: "12 buses/day" },
                { from: "Colombo", to: "Galle", duration: "2h 45m", buses: "18 buses/day" },
                { from: "Colombo", to: "Negombo", duration: "1h 15m", buses: "25 buses/day" },
                { from: "Kandy", to: "Nuwara Eliya", duration: "2h 30m", buses: "8 buses/day" }
              ].map((route, index) => (
                <Card key={index} className="p-4 hover:shadow-soft transition-all duration-300 border border-border">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Bus className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-foreground">
                            {route.from} → {route.to}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{route.duration}</span>
                          <span>{route.buses}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Route
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Commute?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of Sri Lankans who trust BusMate for their daily travel needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Start Searching Routes
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 text-white border-white hover:bg-white hover:text-primary">
              Download Mobile App
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
