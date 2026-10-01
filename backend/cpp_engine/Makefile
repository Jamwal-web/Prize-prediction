# C++ Forecast Engine Makefile
CXX = g++
CXXFLAGS = -O3 -Wall -Wextra -std=c++17

TARGET = forecast_engine
SRCS = forecast_engine.cpp

all: $(TARGET)

$(TARGET): $(SRCS) forecast_engine.h
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET)

clean:
	rm -f $(TARGET) *.o

.PHONY: all clean
