cmake_minimum_required(VERSION 3.10)
project(PricePredictor_DSA_Engine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(forecast_engine forecast_engine.cpp forecast_engine.h)
